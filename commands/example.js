exports.data = {
    //Default: true
    enabled: true,                     //! Gets overwritten by Database config ! Whether the command should be enabled

    //Default: false
    modOnly: true,                     //Make only usable by Twitch Mods & Discord "Manage message" permission

    //Default: true
    twitchEnabled: true,               //Whether it should be usable on Twitch

    //Default: true
    discordEnabled: true,              //Whether it should be usable on Discord

    //Required. Must be globally unique
    commandName: 'example',            //Name that it is invoked by (e.g. !example)

    //Optional. Must be globally unique
    aliases: ['ex','test'],            //Aliases the command is available as

    //Default: None
    options: ['option1','option2'],    //Only provided options are accepted as the second argument

    reply: 'Example command success!', //Message to always reply with when Command is called

    description:                       //Text used for documenting
        'This is an example command' 
};


/**
 * Function that gets executed when command is invoked
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Object} clients Contains all instanced clients {discord: bot, twitch: {chat,api,pub,event}}
 * @param {string} args String remainder of the original message, excluding commandName
 * @return {void}
 */
exports.callback = async (Emitter, clients, args) => {

}

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Discord.Client} bot Discord Client
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
exports.discordCallback = async (Emitter, bot, interaction) => {

}

/**
 * Twitch IRC callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Object} clients Contains Twitch API Clients {chat,api,pub,event}
 * @param {string} channel Name of the IRC channel
 * @param {string} user login_name of the Invoking user
 * @param {*} args String remainder of the original message, excluding commandName
 * @param {*} msgObj Full IRC message object
 * @return {void}
 */
exports.twitchCallback = async (Emitter, clients, channel, user, args, msgObj) => {

}