const Discord = require('discord.js');
const path = require('path')
const fs = require('fs')
const c = require('./../common/logman.js')

var instances;

const bot = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS]});

function init(conf, callbacks) {
    instances = callbacks;
    {
        const authpath = path.normalize(__dirname+'./../../conf/credentials.json');
        const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).discord;
        bot.login(auth.token);
        delete auth, authpath;
    }

    bot.once('ready', () => {
        bot.user.setStatus(conf.Status);
        c.inf(`Logged into Discord API as ${bot.user.tag}`);
    });

    bot.on('interactionCreate', async interaction => {
        instances.Emitter.emit('DiscordInteraction', instances.Emitter, bot, interaction);
        
        if (interaction.isCommand())
            instances.Emitter.emit('DiscordCommand', instances.Emitter, bot, interaction);
    });

    bot.on('message', async msg => {
        instances.Emitter.emit('DiscordMessage', instances.Emitter, bot, msg);
    });

    bot.on('error', error => {
        c.err(error);
    });

    return new Promise(res => setTimeout(()=>{res(1)},1000));
}

function sendTweet(tweetdata) {
    
}


exports.init = init;
exports.bot = bot;

/*
function deployCommands (guildId) {

    //LITERALLY a one-liner
    //idk what the frick you were lookin at
    commands.forEach(cmd => bot.application.commands.create({cmd},guildId));

    //bot.rest.put(Routes.applicationCommands(clientId), { body: commands })
	//    .then(() => c.inf('Successfully registered Discord commands'))
	//    .catch(console.error);
}
*/
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