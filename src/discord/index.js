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

    return new Promise(res => setTimeout(()=>{res(1)},5000));
}


bot.once('ready', () => {
    bot.user.setStatus(conf.Status);
    c.inf(`Logged into Discord API as ${bot.user.tag}`);
});

bot.on('error', error => {
    c.err(error);
});

bot.on('message', async msg => {

});

bot.on('messageReactionAdd', async (reaction, user) => {

});

exports.init = init;