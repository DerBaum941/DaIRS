exports.data = {
    commandName: 'commands',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    aliases: ['cmd','comm'],
    modOnly: true,
    description: "Manage custom commands",
    twitchChoices: ['add','del','en','dis'],
    discordOptions: [
        {
            name: "add",
            description: "Add a custom Command",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "command",
                    description: "The name of the command",
                    type: "STRING",
                    required: true
                },
                {
                    name: "reply",
                    description: "The text to reply with",
                    type: "STRING",
                    required: true
                },
                {
                    name: "ismodonly",
                    description: "Only visible to mods",
                    type: "BOOLEAN",
                    required: false
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a custom command",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "command",
                    description: "Name of the command to delete",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "enable",
            description: "Re-enable a custom command",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "command",
                    description: "Name of the command to enable",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "disable",
            description: "Disable a custom command",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "command",
                    description: "Name of the command to disable",
                    type: "STRING",
                    required: true
                }
            ]
        }
    ]
}

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
 exports.discordCallback = async (Emitter, Clients, interaction) => {
    var option = interaction.options.getSubcommand(true);
    const command = interaction.options.get("command").value;
    var succ = false;
    switch (option) {
        case "add": 
            const reply = interaction.options.get("reply").value;
            const modOnly = interaction.options.get("ismodonly").value;
            succ = addCommand(command,reply,modOnly);
            break;
        case "delete":
            succ = delCommand(command);
            break;
        case "enable":
            succ = enCommand(command);
            break;
        case "disable":
            succ = disCommand(command);
            break;
    }
    if (succ) {
        option = option == "add" ? "adde" : option; //Gotta work with what you got
        interaction.reply(`Successfully ${option}d the command ${command}`);
    }
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
    const success = twitchParse(choice, args);
    if (!success) throw "rejected";

    var choiceStr = "";
    switch(choice) {
        case "add":
            choiceStr = "added";
            break;
        case "del":
            choiceStr = "deleted";
            break;
        case "en":
            choiceStr = "enabled";
            break;
        case "dis":
            choiceStr = "disabled";
            break;
    }
    const name = /(?<cmd>\w+)/.exec(args).groups.cmd;
    Clients.twitch.chat.say(channel, `Successfully ${choiceStr} the command ${name}`, {replyTo: msgObj});
}

function twitchParse(choice, args) {
    if (!args) return false;
    const optionRe =/^(?<cmd>\w+) ?(?<reply>.*)?$/gi;
    args = optionRe.exec(args);
    if (!args?.groups) return false;

    const commandName = args.groups.cmd;
    const reply = args.groups.reply;
    switch(choice) {
        case "add":
            if (!reply) return false;
            return addCommand(commandName, reply, undefined);
        case "del":
            return delCommand(commandName);
        case "en":
            return enCommand(commandName);
        case "dis":
            return disCommand(commandName);
    }
}

const cmdMan = require('../commandHandler.js')();
//Returns true if successful
function addCommand(commandName, reply, isModOnly) {
    return cmdMan.addSimpleCommand(commandName,reply, isModOnly);
}
//Returns true if successful
function delCommand(commandName) {
    return cmdMan.delCustomCommand(commandName);
}
//Returns true if successful
function enCommand(commandName) {
    return cmdMan.enCustomCommand(commandName);
}
//Returns true if successful
function disCommand(commandName) {
    return cmdMan.disCustomCommand(commandName);
}