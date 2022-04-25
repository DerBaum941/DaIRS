const tester = require('../link_whispers.js');

exports.data = {
    commandName: 'link',
    enabled: true,
    twitchEnabled: false,
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
/*
exports.callback = async (Emitter, Clients, args) => {
    const discordFixRe = /(?:^url:)?(?<url>.*)$/gi;
    args = discordFixRe.exec(args).groups.url;
	await tester.testLink(args)
    //If the link is invalid, don't reply;
	.catch(() =>{ throw "rejected"; })
    .then(() => {console.log("Link requested: "+args)});
}
*/

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
 exports.discordCallback = async (Emitter, Clients, interaction) => {
	const link = interaction.options.get("url");

	await tester.testLink(args)
    //If the link is invalid, don't reply;
	.catch(() =>{  })
    .then(() => {tester.queueRedeem(link,interaction.member.displayName)});
}