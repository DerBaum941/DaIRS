const Discord = require('discord.js');
const path = require('path')
const fs = require('fs')
const c = require('./../common/logman.js')
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const https = require('https');
const commands = [];
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));

var instances;

const bot = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS]});
bot.commands = new Discord.Collection();

function deployCommands (clientId, guildId, token) {
    for (const file of commandFiles) {
	    const command = require(`./commands/${file}`);
	    commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '9' }).setToken(token);

    rest.put(Routes.applicationCommands(clientId), { body: commands })
	    .then(() => c.inf('Successfully registered Discord commands'))
	    .catch(console.error);
}

function init(conf, callbacks) {
    instances = callbacks;
    {
        const authpath = path.normalize(__dirname+'./../../conf/credentials.json');
        const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).discord;
        deployCommands(conf.clientId, conf.guildId, auth.token)
        bot.login(auth.token);
        delete auth, authpath;
    }

    bot.once('ready', () => {
        bot.user.setStatus(conf.Status);
        c.inf(`Logged into Discord API as ${bot.user.tag}`);
    });
    
    for (const file of commandFiles) {
	    const command = require(`./commands/${file}`);
	    bot.commands.set(command.data.name, command);
    }

    bot.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const command = bot.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    });

    return new Promise(res => setTimeout(()=>{res(1)},1000));
}


bot.on('error', error => {
    c.err(error);
});

bot.on('message', async msg => {

});

bot.on('messageReactionAdd', async (reaction, user) => {

});

exports.init = init;


/*
//FUCK ME
//This sucks
const jsonD = JSON.stringify(commands[0]);
c.debug(jsonD);
const message = {
    hostname: 'discord.com',
    path:'/api/v9/applications/447114716054159380/guilds/335079645777231882/commands',
    //path: '/api/v9/applications/447114716054159380/commands',
    port: 443,
    method: 'POST',
    headers: {
        'Authorization': 'Bot ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonD)
    }
};
const req = https.request(message, res => {
    c.debug('StatCode: ' + res.statusCode);
    c.debug('Headers: ' + JSON.stringify(res.headers));
    res.on('data', blob => {
        console.log(blob);
    });
});
req.write(jsonD);
req.end();
*/