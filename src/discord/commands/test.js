const { SlashCommandBuilder } = require('@discordjs/builders');
const { URL } = require('url');
const http = require('http');
const https = require('https');

const embed = null;

const data = new SlashCommandBuilder()
	.setName('test')
	.setDescription('Test command')
	.addStringOption(options => options.setName('link').setDescription('gimme link').setRequired(true))

async function checkLink(s) {
	return new Promise((resolve, rej) => {
		const url = new URL(s);
		switch (url.protocol) {
			case 'http:':
				http.request(url, { method: 'HEAD' }, res => {
					console.log('Got a respone;')
					if (!res) rej(false);
					if (Math.floor(res.statusCode / 100) < 4)
						resolve(true);
				}).on('error', rej).end();
				break;
			case 'https:':
				https.request(url, { method: 'HEAD' }, res => {
					if (!res) rej(false);
					if (Math.floor(res.statusCode / 100) < 4) {
						resolve(true);
						console.log('Good respone')
					}
				}).on('error', rej).end();
				break;
			default:
				rej(false);
				break;
		}
	});
}

async function execute (interaction) {
	const link = interaction.options.getString('link');

	await checkLink(link)
	.then(() => { interaction.reply(`Link: \`${link}\``); })
	.catch(() => { interaction.reply(`NO link: \`${link}\``); })
}

exports.data = data;
exports.execute = execute;