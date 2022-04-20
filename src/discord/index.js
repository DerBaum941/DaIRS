const Discord = require('discord.js');
const path = require('path')
const fs = require('fs')
const c = require('./../common/logman.js')
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const commands = [];
const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));

var instances;

const bot = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS]});


function deployCommands (guildId) {

    //LITERALLY a one-liner
    //idk what the frick you were lookin at
    commands.forEach(cmd => bot.application.commands.create({cmd},guildId));

    //bot.rest.put(Routes.applicationCommands(clientId), { body: commands })
	//    .then(() => c.inf('Successfully registered Discord commands'))
	//    .catch(console.error);
}

function init(conf, callbacks) {
    instances = callbacks;
    {
        const authpath = path.normalize(__dirname+'./../../conf/credentials.json');
        const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).discord;
        //deployCommands(conf.clientId, conf.guildId, auth.token)
        bot.login(auth.token);

        //This would've been much smarter
        //bot.rest = new REST({ version: '9' }).setToken(token);

        delete auth, authpath;
    }

    bot.once('ready', () => {
        bot.user.setStatus(conf.Status);
        c.inf(`Logged into Discord API as ${bot.user.tag}`);
    });

    bot.on('interactionCreate', async interaction => {
        instances.Emitter.emit('DiscordInteraction', instances.Emitter, bot, interaction);

        if (!interaction.isCommand()) return;

        instances.Emitter.emit('DiscordCommand', instances.Emitter, bot, interaction);

        /*
        const command = bot.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        */
    });

    bot.on('message', async msg => {
        instances.Emitter.emit('DiscordMessage', instances.Emitter, bot, msg);
    });

    return new Promise(res => setTimeout(()=>{res(1)},1000));
}


bot.on('error', error => {
    c.err(error);
});



bot.on('messageReactionAdd', async (reaction, user) => {

});

exports.init = init;
exports.bot = bot;

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