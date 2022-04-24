const { URL } = require('url');
const http = require('http');
const https = require('https');

exports.data = {
    commandName: 'link',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    replyInDMs: true,
    discordOptions: [{type: "STRING", name: "url", required:true, 
                        description: "ToS or ban :)"}],
    reply: "Successfully requested the link! \nPlease wait for a Mod to approve it",
    description: "Request link to be sent on stream"
};

/**
 * Function that gets executed FIRST when command is invoked
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {string} args String remainder of the original message, excluding commandName
 * @return {void}
 */
exports.callback = async (Emitter, Clients, args) => {
    const discordFixRe = /(?:^url:)?(?<url>.*)$/gi;
    args = discordFixRe.exec(args).groups.url;
	await testLink(args)
    //If the link is invalid, don't reply;
	.catch(() =>{ throw "rejected"; })
    .then(() => {console.log("Link requested: "+args)});
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