const c = require('./logman.js');
const db = require('better-sqlite3')('./src/db/sqlite.db');
const cnf = require('../../conf/general.json');
const fs = require('fs');
const path = require('path');
const { hrtime } = require('process');

/*  =======================================
 *                  Constants
 *  =======================================
 */
const commandPaths = [
    //Relative to node dir
    './commands/',
    './src/common/commands/'
];

class CommandHandler {
    /*  =======================================
     *              Member variables
     *  =======================================
     */
    static #instance; //Singleton self
    #commands = []; //Cache of command objects
    #commandAliases = []; //Dictionary of aliases for Lookups

    /*  =======================================
     *              Public functions
     *  =======================================
     */
    constructor() {
        const start = hrtime.bigint();
        //Load command files
        this.#parseFiles();

        //Load database commands
        this.#parseDatabase();

        //Say something impressive
        const elapsed = (hrtime.bigint() - start) / 1000000n; //ms time
        const commandCount = Object.keys(this.#commands).length;
        const aliasCount = Object.keys(this.#commandAliases).length;
        c.inf(`Loaded ${commandCount} commands(${aliasCount-commandCount} Aliases) in ${elapsed}ms.`);
    }

    static get(...args) {
        if(args[0].Emitter) this.#registerEvents(args[0].Emitter);

        if (this.#instance === undefined)
            this.#instance = new CommandHandler(...args);
        return this.#instance;
    }

    /**
     * Registers a new Command
     * @param {string} commandName Name of command, must be globally unique
     * @param {string} reply Text to reply with on Invoke
     * @param {Object} commandOptions 
     */
    addCustomCommand(commandName, reply, { modOnly, enabled, twitchEnabled, discordEnabled, description, aliases, options }) {
        //Simple check for Duplicate
        if (findCommandByName(commandName)) {
            return null;
        }
        //Create basic command object
        const cmd = this.#validateCommand(commandName, reply, modOnly, enabled, twitchEnabled, discordEnabled, description, aliases, options);
        //Throw it in the DB
        //Cache it
        const result = this.#registerCommand(cmd, false);
        if (!result) {
            return null;
        }
    }
    /**
     * Delete a command or alias
     * @param {string} commandName Name of command or alias to delete
     * @returns {boolean} True if successfully deleted something
     */
    delCustomCommand(commandName) {
    
    }
    enCustomCommand() {
        //Find command, set enabled, load aliases + name
    }
    disCustomCommand() {
        //Find command, set disabled, delete aliases + name
    }

    registerCommandsToDiscord(DiscordClient) {

    }

    /*  =======================================
     *          Callback functions
     *  =======================================
     */
    #twitchMessageHandle(Emitter, Clients, ...stuff) {
        //Make a function to parse out arguments
        //Call dispatch
        //Call the specific handle
        //Reply with content
    }
    #twitchWhisperHandle(Emitter, Clients, ...stuff) {
        //Handle commands too cause why not
    }
    #discordCommandHandle(Emitter, Bot, interaction) {
        //Make a function to parse out arguments
        //Call dispatch
        //Call the specific handle
        //Reply with content
    }
    

    /*  =======================================
     *          Interface functions
     *  =======================================
     */
    #getCommandByName(name) {
        if (this.#commands.length == 0) return;
        this.#commands.forEach(cmd => {
            if (cmd.data.commandName === name.toLowerCase())
                return cmd;
        });
    }

    #findCommandByName(name){
        if (this.#commands.length == 0) return;
        for(const [k, v] of Object.entries(this.#commands)) {
            if (v.data.commandName === name.toLowerCase()) {
                return k;
            }
        }
    }

    /*  =======================================
     *        Implementation functions
     *  =======================================
     */

    #registerEvents(EventEmitter) {
        EventEmitter.on('TwitchMessage',this.#twitchMessageHandle);
        EventEmitter.on('TwitchWhisper',this.#twitchWhisperHandle);
        //EventEmitter.on('DiscordMessage',this.#discordMessageHandle);  //Not implemented. Use Commands instead.
        EventEmitter.on('DiscordCommand',this.#discordCommandHandle);
    }

    #parseFiles() {
        //Read in Files in command paths and push valid ones onto the Array
        //Validate each script file
        //Register good commands
        var commandFilepaths = [];
        commandPaths.forEach(fpath=> {
            const files = fs.readdirSync(path.resolve(fpath)).filter(file => file.endsWith('.js'));
            files.forEach(file => {
                commandFilepaths.push(path.join(fpath,file));
            })
        });

        for (const filepath of commandFilepaths) {
            const command = this.#validateModule(filepath);
            if (!command) {
                c.warn('Failed to load command file: '+path.basename(filepath));
                continue;
            }

            const success = this.#registerCommand(command,true);
            if (!success) {
                c.warn('Failed to register command: '+ command.data.commandName);
                continue;
            }
        }
    }

    #parseDatabase() {
        //Read the database table
        //Create Command objects
        //Put them in the DB
        const getCustomCommands = db.prepare("SELECT * FROM chat_commands WHERE builtFromFile = 0");
        const getCustomAliases = db.prepare("SELECT * FROM command_alias WHERE commandID = ?");

        const cmdFromRow = (row) => {
            const domain = JSON.parse(row.domain);
            return {
                data: {
                    enabled: row.enabled,
                    modOnly: row.modOnly,
                    twitchEnabled: domain.twitch,
                    discordEnabled: domain.discord,
                    commandName: row.commandName,
                    aliases: new Set(), //Gets populated later
                    options: JSON.parse(row.options),
                    reply: row.content,
                    description: row.description
                },
                callback: async () => { },
                discordCallback: async () => { },
                twitchCallback: async () => { }
            }
        }

        var tmpAliases = [];
        var tmpCommands = [];

        //Read commands Table
        const commandResult = getCustomCommands.all();
        commandResult.forEach(row => {
            const cmd = cmdFromRow(row);
            const id = row.commandID;
            tmpCommands[id] = cmd;

            //Read aliases
            const aliases = getCustomAliases.all(id);
            aliases.forEach(row => {
                const alias = row.aliasName;
                tmpAliases[alias] = id;
                tmpCommands[id].data.aliases.add(alias);
            });
        });

        //Sanity check
        if (tmpCommands.length != commandResult.length) {
            c.warn(`Failed to fetch all Custom Commands (Got ${tmpCommands.length} of ${commandResult.length})`);
            return;
        }

        //Push Database values onto Cache fields
        for(const [k,v] of Object.entries(tmpCommands)) {
            if(this.#commands[k]) {
                c.warn(`Can't load command ${v.commandName}: Command clashes with already loaded command`);
                continue;
            }
            this.#commands[k] = v;
        }
        for(const [k,v] of Object.entries(tmpAliases)) {
            if(this.#commandAliases[k]) {
                c.warn(`Can't load alias ${k}: Alias clashes with already loaded alias`);
                continue;
            }
            this.#commandAliases[k] = v;
        }
    }


    /**
     * 
     * @param {Object} cmd Command Object. MUST be validated beforehand.
     * @param {boolean} fromFile True when command is parsed from a file. False for custom commands
     * @returns {boolean} True if Command Successfully registered
     */
    #registerCommand(cmd, fromFile) {
        //Check if it's already registered in the Database
        //Yes: Update data fields and aliases
        //No: Save to DB

        const getID = db.prepare("SELECT commandID FROM chat_commands WHERE commandName = ?");
        const findCommand = db.prepare("SELECT commandName,builtFromFile FROM chat_commands WHERE commandID = ?");
        const findAlias = db.prepare("SELECT aliasID, commandID FROM command_alias WHERE aliasName = ?");

        const Warning = `Can't load command ${cmd.data.commandName}:`;

        //Try to find in DB
        const commandID = getID.pluck().get(cmd.data.commandName);

        const domainString = `{"twitch":${cmd.data.twitchEnabled},"discord":${cmd.data.discordEnabled}}`;

        //Check info object
        const checkDBInfo = (info) => {
            if(info.changes == 0) {
                c.warn(`${Warning} Failed to update Database entry`);
                return false;
            } else if (info.changes > 1) {
                c.warn(`${Warning} Changed too many rows on update (${info.changes})`);
                return false;
            }
            return true;
        }

        //Has already been registered to the DB
        if (commandID) {
            //Check if command has already been registered
            if(this.#commands[commandID] || this.#findCommandByName(cmd.data.commandName)) {
                c.warn(`${Warning} Command clashes with already loaded command`);
                return false;
            }

            if (fromFile) {
                //Confirm the DB row is a file command
                const isFileCommand = findCommand.get(commandID);
                if (isFileCommand.builtFromFile == 0) {
                    c.warn(`${Warning} Command clashes with existing entry`);
                    return false;
                }
            }

            //Confirm all aliases are only used by this command
            try {
                cmd.data.aliases.forEach(alias => {
                    const row = findAlias.get(alias);
                    //If they mismatch it's dupes
                    if (row && row.commandID != commandID) {
                        //Get command Name for debugging
                        const clashCommand = findCommand.pluck().get(row.commandID);
                        c.warn(`${Warning} Alias ${alias} clashes with command ${clashCommand}`);
                        throw "Command has duplicate aliases";
                    }
                });
            } catch (e) {
                return false;
            }

            //Only give DB implicit presedence on File commands
            //Convience such that newly added overwrites are always enabled (or have been disabled explicitely)
            if(fromFile) {
                //Fetch enable status from DB
                const isEnabled = db.prepare("SELECT enabled FROM chat_commands WHERE commandID = ?").pluck().get(commandID);
                cmd.data.enabled = isEnabled == 0 ? false : true;
            }

            //Overwrite Database entry with current Data
            const updateCommand = db.prepare("UPDATE chat_commands SET options=?, enabled=?, modOnly=?, domain=?, content=?, description=? WHERE commandID = @id");
            const info = updateCommand.run(
                {id: commandID},
                JSON.stringify(cmd.data.options),
                cmd.data.enabled ? 1 : 0,
                cmd.data.modOnly ? 1 : 0,
                domainString,
                cmd.data.reply,
                cmd.data.description
            );

            if(!checkDBInfo(info)) {
                c.warn(`${Warning} Failed to update to Database`);
                return false;
            }


            //Update Aliases
            const insertAlias = db.prepare(`INSERT INTO command_alias(commandID, aliasName) VALUES(@id,?)`);
            
            try {
                cmd.data.aliases.forEach(alias => {
                    const row = findAlias.get(alias);
                    //Only cache alias if already in place
                    if (row) {
                        this.#commandAliases[alias] = commandID;
                        return;
                    }
                    //Insert if new
                    const result = insertAlias.run({id: commandID}, alias);

                    if (checkDBInfo(result))//All good. Cache it
                        this.#commandAliases[alias] = commandID;
                    else throw "Failed to update alias"+alias;
                });
            } catch (e) {
                c.warn(`${Warning} ${e}`);
                return false;
            }

            //Add command to Cache
            this.#commands[commandID] = cmd;
            return true;
        }

        //Register new command to Database
        else {
            //Check for duplicatation
            if (this.#findCommandByName(cmd.data.commandName)) {
                c.warn(`${Warning} Command clashes with already loaded command`);
                return false;
            }

            //Confirm all aliases are only used by this command
            try {
                cmd.data.aliases.forEach(alias => {
                    const row = findAlias.get(alias);
                    if (row && row.commandID != commandID) {
                        const clashCommand = findCommand.pluck().get(row.commandID);
                        c.warn(`${Warning} Alias ${alias} clashes with command ${clashCommand}`);
                        throw "Command has duplicate aliases";
                    }
                });
            } catch (e) {
                return false;
            }

            //Create Database Entries
            const insertCommand = db.prepare("INSERT INTO chat_commands(commandName, options, enabled, modOnly, domain, content, description, builtFromFile) VALUES (?,?,?,?,?,?,?,?)");
            const info = insertCommand.run(
                cmd.data.commandName,
                JSON.stringify(cmd.data.options),
                cmd.data.enabled ? 1 : 0,
                cmd.data.modOnly ? 1 : 0,
                domainString,
                cmd.data.reply,
                cmd.data.description,
                fromFile ? 1 : 0
            );
            if(checkDBInfo(info))//All good. Cache it
                this.#commands[info.lastInsertRowid] = cmd;
            else
                return false;
            
            //Save aliases
            const insertAlias = db.prepare("INSERT INTO command_alias(commandID, aliasName) VALUES (@id,?)");
            try {
                cmd.data.aliases.forEach(alias => {
                    const result = insertAlias.run({id:info.lastInsertRowid},alias);
                    if (checkDBInfo(result))//All good. Cache it
                        this.#commandAliases[alias] = info.lastInsertRowid;
                    else throw "Command has duplicate aliases";
                });
            } catch (e) {
                c.warn(`${Warning} Failed to store aliases: ${e}`);
                return false;
            }
            return true;
        }
    }

    #validateCommand(commandName, reply, modOnly, enabled, twitchEnabled, discordEnabled, description, aliases, options) {
        if(!commandName) return null;
        reply = reply !== undefined ? reply : null;
        modOnly = modOnly !== undefined ? modOnly : false;
        enabled = enabled !== undefined ? enabled : true;
        twitchEnabled = twitchEnabled !== undefined ? twitchEnabled : true;
        discordEnabled = discordEnabled !== undefined ? discordEnabled : true;
        description = description !== undefined ? description : null;
    
        //If aliases is not an array, overwrite it
        if (!aliases?.length)
            aliases = [];
        //If it's not a pure array of strings, overwrite it
        if (!aliases.every(i=> typeof i === "string" ))
            aliases = [];
    
        //Convert aliases to set to strip duplicates
        var newSet = new Set();
        aliases.forEach(alias =>newSet.add(alias.toLowerCase()));
        aliases = newSet;
    
        //Treat commandName as an alias of itself for faster Lookups
        aliases.add(commandName.toLowerCase());
    
        //Copy relevant Information and Return it
        const command = {
            data: {
                enabled: enabled,
                modOnly: modOnly,
                twitchEnabled: twitchEnabled,
                discordEnabled: discordEnabled,
                commandName: commandName,
                aliases: aliases,
                options: options,
                reply: reply,
                description: description
            },
            callback: async ()=> { },
            discordCallback: async ()=> { },
            twitchCallback: async ()=> { }
        }
        return command;
    }
    #validateModule (filePath) {
        /*  Section 1
         *  Validate Path & Load module
         */

        //Remove leading path and split at folders
        //Ensure it is a .js file
        //const pathRe=/(\\commands\\)(\w*\\)*([\w-]+\.js)/gi;
        //var groups = filePath.split(pathRe);
        //Remove trailing crap
        //Remove unmatched optional Groups
        //groups = groups.slice(0,-1).filter( Boolean );

        //If the Match failed the path was invalid
        //if (groups.length <=1) return null;
        //Has to have a commands folder
        //if (!groups.includes('commands')) return null;

        //If it's in the commands/disabled/ directory, skip the files
        //if (groups[1] === 'disabled\\') return true;

        //Create relative path so node can include it
        const relativePath = '.\\'+path.relative(__dirname, path.resolve(filePath));
        //c.debug("Loading command "+groups[groups.length-1]);
        //Load the .js file
        var cmdModule = require(relativePath);

        /*  Section 2
         *  Validate Contents & Set Defaults
         */

        //Check if there is exports
        if (!cmdModule || cmdModule?.exports == {}) return null;

        //Make sure there is a data object
        if (!cmdModule.data) return null;

        //Name has to exist as a string
        if (!cmdModule.data.commandName) return null;
        if (!(typeof cmdModule.data.commandName === "string")) return null;

        //Set Name to lowercase
        cmdModule.data.commandName = cmdModule.data.commandName.toLowerCase();

        //If domain flags aren't set, put default booleans
        if (cmdModule.data.twitchEnabled === undefined)
            cmdModule.data.twitchEnabled = true;
        if (cmdModule.data.discordEnabled === undefined)
            cmdModule.data.discordEnabled = true;
        
        //If config flags aren't set, put default booleans
        if (cmdModule.data.enabled === undefined)
            cmdModule.data.enabled = true;
        if (cmdModule.data.modOnly === undefined)
            cmdModule.data.modOnly = false;
        
        //If reply isn't set, make it null
        if (cmdModule.data.reply === undefined)
            cmdModule.data.reply = null;
        //If description isn't set, make it null;
        if (cmdModule.data.description === undefined)
            cmdModule.data.description = null;
        
        //If options is not an array, overwrite it
        if (!cmdModule.data.options?.length)
            cmdModule.data.options = [];
        //If it's not a pure array of strings, overwrite it
        if (!cmdModule.data.options.every(i=> typeof i === "string" ))
            cmdModule.data.options = [];

        //If aliases is not an array, overwrite it
        if (!cmdModule.data.aliases.length)
            cmdModule.data.aliases = [];
        //If it's not a pure array of strings, overwrite it
        if (!cmdModule.data.aliases.every(i=> typeof i === "string" ))
            cmdModule.data.aliases = [];

        
        //Convert aliases to set to strip duplicates
        var newSet = new Set();
        cmdModule.data.aliases.forEach(alias =>newSet.add(alias.toLowerCase()));
        cmdModule.data.aliases = newSet;

        //If it had no function defined, add one
        if (!cmdModule.callback) 
            cmdModule.callback = async () => {};
        if (!cmdModule.discordCallback)
            cmdModule.discordCallback = async () => {};
        if (!cmdModule.twitchCallback)
            cmdModule.twitchCallback = async () => {};

        //Treat commandName as an alias of itself for faster Lookups
        cmdModule.data.aliases.add(cmdModule.data.commandName);

        /*  Section 3
         *  Copy relevant Information and Return it
         */

        const command = {
            data: cmdModule.data,
            callback: cmdModule.callback,
            discordCallback: cmdModule.discordCallback,
            twitchCallback: cmdModule.twitchCallback
        }
        return command;
    }

    //Old
    #dispatch(commandName, args) {
        //Find Command
        const commandID = this.#findCommandByName(commandName);
        if (!commandID) return null;

        const cmd = this.#commands[commandID];
        if (!cmd) return null;

        //Try to dispatch the callback
        try {
            cmd.callback(args);

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
}

module.exports = (...args) => {
    return CommandHandler.get(...args);
};

//Deprecated
//Lasted one entire Day o7
class Command {
    #name;
    #replyText;
    #isModOnly = false;
    #aliases = [];
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
    constructor(name, reply, modOnly, aliases, domain) {
        if (!name) throw "Command created with invalid name!";
        this.#name = name.toLowerCase();

        //Set Inputs or Defaults
        this.#replyText = reply ? reply : null;
        this.#isModOnly = modOnly === undefined ? this.#isModOnly : modOnly;
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

    dispatch(args) {
        this.#callbacks.forEach(fn => {
            fn(args);
        });
        return this.#replyText;
    }
}

