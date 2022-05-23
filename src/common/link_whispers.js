const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { URL } = require('url');
const http = require('http');
const https = require('https');


var instances, conf;
var allowRequests = true;

async function init(cnf, callbacks) {
    instances = callbacks;
    conf = cnf;

    instances.Emitter.on('LinkToggle', (enable) => {
        allowRequests = enable;
    });

    instances.Emitter.on('TwitchWhisper', async (Emitter, clients, user, message, msg) => {
        if (!allowRequests) return;
        if(message.startsWith(conf.twitch.commandPrefix)) return;

        queueRedeem(message,user,msg.userInfo.color);
        instances.Emitter.emit('LinkRequest', msg.userInfo.userId, message);
    });

    instances.Emitter.on('DiscordInteraction', async (Emitter, bot, interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'linkallow') return;
    
        const ogUser = interaction.message.embeds[0].title;
        const ogUrl = interaction.message.embeds[0].description;
        const message = `${ogUser}: ${ogUrl}`;
        await instances.Twitch.sendToStream(message);
    
        const username = interaction.member.displayName;
        interaction.update({content: `Link accepted by ${username}:`, components: []})
    });

}
exports.init = init;


const isClip = new RegExp("^(https:\/\/.*twitch\.tv\/.*\/clip\/.*)$");
async function queueRedeem(message,user,color) {

    //Go to text channel
    const bot = instances.Discord.bot;
    const channel = await bot.channels.fetch(conf.discord.linkRequestChannelID);

    if (channel.type != "GUILD_TEXT") return;

    testLink(message)
    .then(() => {

        var url = message;
        if (!(url.startsWith("http://") ||
                url.startsWith("https://")))
            url = "https://"+url;

        //Get twitch color
        color = color ? color : "#ff00ff";

        if (url.startsWith("https://clips.twitch.tv/") ||
            isClip.test(url)) {
            const post = `${user}: ${url}`;
            instances.Twitch.sendToStream(post);
            return;
        }

        //Create Embed for link text
        const embed = new MessageEmbed()
                            .setColor()
                            .setTitle(user)
                            .setURL('https://twitch.tv/'+user)
                            .setDescription(message)

        const row = new MessageActionRow();

        row.addComponents(new MessageButton()
                                .setCustomId('linkallow')
                                .setLabel('Allow Link')
                                .setStyle('SUCCESS'));

        row.addComponents(new MessageButton()
                                .setLabel('Open url')
                                .setStyle('LINK')
                                .setURL(url));

        channel.send({content: `<@&${conf.discord.modRoleID}> - Link Request:`, embeds: [embed], components: [row]});

    }, ()=>{})
    .catch(()=>{});
}

function testLink(link) {
    //Quality of Life fix
    if (!(link.startsWith("http://") ||
        link.startsWith("https://")))
            link = "https://"+link;
	return new Promise((resolve, rej) => {
		const url = new URL(link);
		switch (url.protocol) {
			case 'http:':
				http.request(url, { method: 'HEAD' }, res => {
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
					}
				}).on('error', rej).end();
				break;
			default:
				rej(false);
				break;
		}
	});
}
exports.testLink = testLink;