const db = require('better-sqlite3')('./src/db/sqlite.db');
const twit = require('../../twitch/index.js');
class TriggerHandle {
    static #instance;
    triggers = [];

    constructor() {
        this.#loadTriggers();
        twit.Clients.chat.onMessage((channel, user, message)=>this.onMessage(channel, user, message));
    }
    static get() {
        if (this.#instance === undefined) 
            this.#instance = new TriggerHandle();
        return this.#instance;
    }

    #insert = db.prepare("INSERT INTO twitch_chat_triggers(triggerName, reply) VALUES(?,?)");
    addTrigger(name, reply) {
        if (this.triggers[name])
            return false;
        try {
            const info = this.#insert.run(name, reply);
            if (info.changes != 1)
                throw new Error("trigger not unique");
            
            this.triggers[name] = reply;
            return true;
        } catch {
            return false;
        }
    }
    #delete = db.prepare("DELETE FROM twitch_chat_triggers WHERE triggerName = ?");
    delTrigger(name) {
        if(!this.triggers[name])
            return false;
        
        try {
            const info = this.#delete.run(name);
            if (info.changes != 1)
                throw new Error("trigger not unique");
            delete this.triggers[name];
            return true;
        } catch {
            return false;
        }
    }

    #select = db.prepare("SELECT triggerName, reply FROM twitch_chat_triggers");
    #loadTriggers() {
        const data = this.#select.all();
        if (!data)
            return false;
        data.forEach(row => {
            this.triggers[row.triggerName] = row.reply;
        })
    }

    #increment = db.prepare("UPDATE twitch_chat_triggers SET countUsed = countUsed + 1 WHERE triggerName = ?");
    //Twitch event
    onMessage(channel, user, message) {
        if (!channel) return;
        
        const trig = this.triggers[message];
        if (trig) {
            this.#increment(message);
            twit.sendToStream(trig);
            return;
        }

        for (const [k,v] of Object.entries(this.triggers)) {
            if (message.startsWith(k)) {
                this.#increment(message);
                twit.sendToStream(v);
                return;
            }
        }
    }
}

const handler = TriggerHandle.get();

exports.data = {
    commandName: 'triggers',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    aliases: ['trig'],
    modOnly: true,
    description: "Manage chat triggers",
    twitchChoices: ['add','del'],
    discordOptions: [
        {
            name: "add",
            description: "Add a custom Command",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "trigger",
                    description: "The name of the trigger",
                    type: "STRING",
                    required: true
                },
                {
                    name: "reply",
                    description: "The text to reply with",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a chat trigger",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "trigger",
                    description: "Name of the trigger to delete",
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
    const command = interaction.options.get("trigger").value;

    var succ = false;
    switch (option) {
        case "add": 
            const reply = interaction.options.get("reply").value;
            succ = handler.addTrigger(command,reply);
            break;
        case "delete":
            succ = handler.delTrigger(command);
            break;
    }
    if (succ) {
        option = option == "add" ? "adde" : option; //Gotta work with what you got
        interaction.reply(`Successfully ${option}d the chat trigger ${command}`);
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
    if(!args)
        throw "rejected";

     const success = twitchParse(choice, args);
     if (!success)
        throw "rejected";

    var choiceStr = "";
    switch(choice) {
        case "add":
            choiceStr = "added";
            break;
        case "del":
            choiceStr = "deleted";
            break;
    }
    const name = /(?<cmd>\w+)/.exec(args).groups.cmd;
    Clients.twitch.chat.say(channel, `Successfully ${choiceStr} the trigger ${name}`, {replyTo: msgObj});
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
            return handler.addTrigger(commandName, reply);
        case "del":
            return handler.delTrigger(commandName);
    }
}