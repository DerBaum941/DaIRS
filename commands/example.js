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
    twitchChoices: ['option1','option2'], //Only provided choices are accepted as the second argument

    //Default: None
    discordOptions: [],                //Must resolve to Discord Options: https://discord.js.org/#/docs/discord.js/stable/typedef/ApplicationCommandOptionData

    //Default false
    replyInDMs: false,                 //Replies in the command's channel if false | Sends a DM / Whisper otherwise

    reply: 'Example command success!', //Message to always reply with when Command is called

    description:                       //Text used for documenting
        'This is an example command' 
};

//NOTE: Callback functions may throw "rejected"; in this case, no reply will be sent

/**
 * Function that gets executed FIRST when command is invoked
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {string} args String remainder of the original message, excluding commandName
 * @return {void}
 */
exports.callback = async (Emitter, Clients, args) => {

}

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
exports.discordCallback = async (Emitter, Clients, interaction) => {

}

/**
 * Twitch IRC callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {string} channel Name of the IRC channel
 * @param {string} user login_name of the Invoking user
 * @param {string?} choice The selected choice, if one was defined
 * @param {*} args String remainder of the original message, excluding commandName and choice
 * @param {*} msgObj Full IRC message object
 * @return {void}
 */
exports.twitchCallback = async (Emitter, Clients, channel, user, choice, args, msgObj) => {

}