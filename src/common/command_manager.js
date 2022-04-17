const c = require('./logman.js');
const db = require('better-sqlite3')('../db/sqlite.db');
const cnf = require('../../conf/general.json');

var instances;
export async function init(conf, callbacks) {
    instances = callbacks;
}

class Command {
    #name;
    #replyText;
    #isModOnly = false;
    #aliases = [];
    #isBuiltin = false;
    #isDiscordCommand = true;
    #isTwitchCommand = true;

    #callbacks = [];
    static #numCommands = 0;

    /**
     * Registers new Command on instatiation
     * @param {string} name Case Insensitive, w/o prefix (e.g. !ping -> 'Ping')
     * @param {string} reply Message to reply with when command is called
     * @param {boolean} modOnly Whether command is restricted to Twitch Mods / Discord "Manage Nessages" Permission
     * @param {string[]} aliases Default aliases to create (e.g. !test -> ['tset','tets'])
     * @param {Object {twitch: true, discord: true}} domain Where this command is allowed to be invoked from
     * @param {boolean} isBuiltin True for system commands that shouldn't be modifyable
     */
    constructor(name, reply, modOnly, aliases, domain, isBuiltin) {
        if (!name) throw "Command created with invalid name!";
        this.#name = name.toLowerCase();

        //Set Inputs or Defaults
        this.#replyText = reply ? reply : null;
        this.#isModOnly = modOnly === undefined ? this.#isModOnly : modOnly;
        this.#isBuiltin = isBuiltin === undefined ? this.#isBuiltin : isBuiltin;
        this.#aliases = aliases?.length > 0 ? aliases : this.#aliases;
        this.#isDiscordCommand = domain?.discord === undefined ? this.#isDiscordCommand : domain.discord;
        this.#isTwitchCommand = domain?.twitch === undefined ? this.#isTwitchCommand : domain.twitch;

        //Increment total func count cuz why not
        this.#numCommands++;
    }

    /**
     * Add a called Function to the Command
     * @param {(string)=>void} callbackFn Function to dispatch with single string of text, excluding command name
     */
    addCallback(callbackFn) {
        this.#callbacks.push(callbackFn);
    }

    getName() { return this.#name; }
    getReply() { return this.#replyText; }
    isTwitchCommand() { return this.#isTwitchCommand; }
    isDiscordCommand() { return this.#isDiscordCommand; }
    isModOnly() { return this.#isModOnly; }
    isSystemCommand() { return this.#isBuiltin; }

    dispatch(args) {
        this.#callbacks.forEach(fn => {
            fn(args);
        });
        return this.#replyText;
    }
}


class CommandHandler {
    static #instance;
    #commandObjects = [];

    constructor() {
        this.#instance = this;
        // Get from Database
        this.#parseFromDatabase();
    }

    static get() {
        if (this.#instance === undefined)
            return new CommandHandler();
        return this.#instance;
    }

    getCommandByName(name) {
        if (this.#commandObjects.length == 0) return;
        this.#commandObjects.forEach(cmd => {
            if (cmd.getName() === name.toLowerCase())
                return cmd;
        });
    }

    #findCommandByName(name){
        if (this.#commandObjects.length == 0) return;
        for(const [k, v] of Object.entries(this.#commandObjects)) {
            if (v.getName() === name.toLowerCase()) {
                return k;
            }
        }
    }

    #parseFromDatabase() {
        //Read the database table
        //Create Command objects
        //Put them in the DB
    }


    #dispatch(commandName, args) {
        //Find Command
        const commandID = this.#findCommandByName(commandName);
        if (!commandID) return null;

        const cmd = this.#commandObjects[commandID];
        if (!cmd) return null;

        //Try to dispatch the callback
        try {
            cmd.dispatch(args);

            //Increment DB Counter
            const query = 'UPDATE SET `countUsed`=`countUsed`+1 WHERE commandID = ?';
            const info = db.prepare(query).run(commandID);

            if (!info || info?.changes == 0)
                throw 'Couldn\'t increment use counter for command';
            else if (info.changes > 1)
                //This should never EVER happen but just in case
                throw 'Incrementing use count of command failed horribly';
        } catch (e) {
            c.err('Couldn\'t execute command '+commandName);
            c.err(e);
        }
    }

    #saveCommandToDatabase(cmd) {
        const domain = {twitch: cmd.isTwitchCommand(), discord: cmd.isDiscordCommand()};

        //Check for duplicates in DB
        const commandName = cmd.name.toLowerCase();
        const query = `SELECT aliasName FROM command_alias WHERE aliasName = ?`;
        const result = db.prepare(query).pluck().get(commandName);
        if (result) 
            throw 'Command already exists in Database';
        
        var id;
        {
            const query = `INSERT INTO chat_commands(mutable,modOnly,commandName,domain,content) VALUES (?,?,?,?,?)`;
            const info = db.prepare(query).run([
                cmd.isSystemCommand() ? 0 : 1,  //Not mutable if System
                cmd.isModOnly() ? 1 : 0,
                commandName,
                JSON.stringify(domain),
                cmd.getReply()
            ]);
            if (!info || info?.changes == 0)
                throw 'Saving command to Database failed';
            else if (info.changes > 1)
                //This should never EVER happen but just in case
                throw 'Saving command to Database changed overflowed';

            /*
             * DO THE THING AGAIN BUT ALIASES!!!!!!!!!!
             */

            id = info.lastInsertRowid;
        }
        {
            //Validate Save
            const query = db.prepare('SELECT commandID FROM chat_commands WHERE commandName = ?');
            const res = query.pluck().get(commandName);
            if (id != res)
                throw 'Database insertion ID mismatch';
        }

        return id;
    }

    registerCommand(command) {
        const name = command.getName();

        //Check if already exists
        const dupe = this.getCommandByName(name);
        if (dupe) {
            c.warn('Duplicate Command added to Handler');
            return null;
        }

        //Attempt writing to Database
        var id;
        try {
            id = this.#saveCommandToDatabase(commandName, command);
        } catch (e){
            c.err(e);
        }
        if (id === undefined) {
            c.err('Something went horribly wrong');
            return null;
        }

        //Store command in cache
        this.#commandObjects[id] = command;

    }

    twitchMessageHandle() {
        //Do some stuff
        //..

        //Check if you should
        //Call the dispatch thing
        const replyTxt = this.#dispatch(commandName,args);

        //Increment use counter

        //Send Text reply in same channel
        //..
    }
    discordMessageHandle() {
        //Do some stuff
        //..

        //Call the dispatch thing
        const replyTxt = this.#dispatch(commandName,args);

        //Increment use counter

        //Send Text reply in same channel
        //..
    }
}

exports.Command = Command;
exports.CommandHandler = CommandHandler;