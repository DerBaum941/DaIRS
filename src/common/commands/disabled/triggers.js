const db = require('better-sqlite3')('./src/db/sqlite.db');
class TriggerHandle {
    static #instance;
    triggers = [];

    constructor() {

    }
    static get() {
        if (this.#instance === undefined) {
            this.#instance = new CommandHandler();
        }
        return this.#instance;
    }

    #insert = db.prepare("");
    addTrigger(name, reply) {

    }
    delTrigger(name, reply) {

    }

    loadTriggers() {

    }
    
}

exports.data = {
    commandName: 'triggers',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    aliases: ['trig'],
    modOnly: true,
    description: "Manage chat triggers",
    twitchChoices: ['add','del','en','dis'],
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