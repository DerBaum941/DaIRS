const data = {
    commandName: 'ping',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    aliases: ['ligma'],
    description: "Latency tester"
};
exports.data = data;

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Discord.Client} bot Discord Client
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
exports.discordCallback = async (Emitter, bot, interaction) => {
    interaction.reply({content:`Pong! (...)`, fetchReply: true}).then(reply => {
        const diff = reply.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`Pong! (${diff}ms.)`);
    });
}

/**
 * Twitch IRC callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Object} clients Contains Twitch API Clients {chat,api,pub,event}
 * @param {string} channel Name of the IRC channel
 * @param {string} user login_name of the Invoking user
 * @param {string?} choice The selected choice, if one was defined
 * @param {*} args String remainder of the original message, excluding commandName and choice
 * @param {*} msgObj Full IRC message object
 * @return {void}
 */
exports.twitchCallback = async (Emitter, clients, channel, user, choice, args, msgObj) => {
    clients.chat.say(channel, `Pong! (${Date.now() - msgObj.timestamp}ms.)`, {replyTo: msgObj});
}