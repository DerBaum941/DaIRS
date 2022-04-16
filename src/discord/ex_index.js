const Discord = require('discord.js');
const logger = require('./src/common/logman.js');
const cfg = require('./config.json');

const bot = new Discord.Client();
const cs = new logger.LogMan();

bot.once('ready', () => {
	bot.user.setStatus('Reviewing memery');
	cs.inf('[Ready] Waiting for new memes...');
});

bot.on('error', error => {
	cs.err("Generic error thrown: ");
	console.log(error);
	return;
});

bot.login(cfg.Token);

bot.on('message', async msg => {

});

bot.on('messageReactionAdd', async (reaction, user) => {

});