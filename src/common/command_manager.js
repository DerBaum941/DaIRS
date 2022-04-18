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
    path.resolve(__dirname,'./commands'),
    path.resolve(__dirname,'../../commands/')
];

/*  =======================================
 *              Member variables
 *  =======================================
 */
var instances;
var commands = [];
var commandAliases = [];

/*  =======================================
 *              Public functions
 *  =======================================
 */
async function init(conf, callbacks) {
    instances = callbacks;

    const start = hrtime.bigint();
    //Load command files
    parseFiles();

    //Load database commands
    parseDatabase();

    //Say something impressive
    const elapsed = Math.floor((hrtime.bigint() - start) / 1e6) //ms time
    c.inf(`Loaded ${commands.length} commands(${commandAliases.length} Aliases) in ${elapsed}ms.`)

    return new Promise(res=>setTimeout(res,500));
}
function addCustomCommand() {

}
function delCustomCommand() {
    
}
function enCustomCommand() {
    
}
function disCustomCommand() {
    
}

/*  =======================================
 *          Callback functions
 *  =======================================
 */
function twitchMessageHandle() {
    //Make a function to parse out arguments
    //Call dispatch
    //Call the specific handle
    //Reply with content
}
function discordMessageHandle() {
    //Make a function to parse out arguments
    //Call dispatch
    //Call the specific handle
    //Reply with content
}

/*  =======================================
 *          Interface functions
 *  =======================================
 */
function getCommandByName(name) {
    if (commands.length == 0) return;
    commands.forEach(cmd => {
        if (cmd.data.commandName === name.toLowerCase())
            return cmd;
    });
}
function findCommandByName(name) {
    if (commands.length == 0) return;
    for(const [k, v] of Object.entries(commands)) {
        if (v.data.commandName === name.toLowerCase()) {
            return k;
        }
    }
}

/*  =======================================
 *        Implementation functions
 *  =======================================
 */
function parseFiles() {
    //Read in Files in command paths and push valid ones onto the Array
    //Validate each script file
    //Register good commands
    var commandFiles = [];
    commandPaths.forEach(path=> {
        const files = fs.readdirSync(path).filter(file => file.endsWith('.js'));
        commandFiles.push(files);
    });

    for (const file of commandFiles) {
        const command = validateModule(`/commands/${file}`);
        if (!command) {
            c.warn('Failed to load command file: '+file);
            continue;
        }
        registerFileCommand(command);
    }
}
function registerFileCommand(cmd) {
    //Check if it's already registered in the Database
    //Yes: Update data fields and aliases
    //No: Save to DB

    const getID = db.prepare("SELECT commandID FROM chat_commands WHERE commandName = ?");
    const findCommand = db.prepare("SELECT commandName,builtFromFile FROM chat_commands WHERE commandID = ?");
    const findAlias = db.prepare("SELECT aliasID, commandID FROM command_alias WHERE aliasName = ?");

    const Warning = `Can't load command ${cmd.commandName}:`

    //Try to find in DB
    const commandID = getID.pluck().get(cmd.commandName);

    const domainString = `{"twitch":${cmd.isTwitchCommand},"discord":${cmd.isDiscordCommand}}`;

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
        if(commands[commandID] || findCommandByName(cmd.commandName)) {
            c.warn(`${Warning} Command clashes with already loaded command`);
            return;
        }

        //Confirm the DB row is a file command
        const isFileCommand = findCommand.get(commandID);
        if (isFileCommand.isBuiltin == 0) {
            c.warn(`${Warning} Command clashes with existing entry`);
            return;
        }

        //Confirm all aliases are only used by this command
        try {
            cmd.aliases.forEach(alias => {
                const row = findAlias.get(alias);
                if (row?.commandID != commandID) {
                    const clashCommand = findCommand.pluck().get(row.commandID);
                    c.warn(`${Warning} Alias ${alias} clashes with command ${clashCommand}`);
                    throw "Command has duplicate aliases";
                }
            });
        } catch (e) {
            return;
        }

        //Fetch enable status from DB
        const isEnabled = db.prepare("SELECT enabled FROM chat_commands WHERE commandID = ?").pluck().get(commandID);
        cmd.enabled = isEnabled == 0 ? false : true;

        //Overwrite Database entry with current Data
        const updateCommand = db.prepare("UPDATE chat_commands SET options=?, modOnly=?, domain=?, content=?, description=? WHERE commandID = @id");
        const info = updateCommand.run(
            {id: commandID},
            JSON.stringify(cmd.options),
            cmd.modOnly ? 1 : 0,
            domainString,
            cmd.reply,
            cmd.description
        );
        checkDBInfo(info);


        //Update Aliases
        const insertAlias = db.prepare(`INSERT INTO command_alias(commandID, aliasName) VALUES(@id,?)`).bind({id: commandID});

        cmd.aliases.forEach(alias => {
            const row = findAlias.get(alias);
            //Only cache alias if already in place
            if (row) {
                commandAliases[alias] = commandID;
                return;
            }
            //Insert if new
            const result = insertAlias.run(alias);

            if (checkDBInfo(result))//All good. Cache it
                commandAliases[alias] = commandID;
        });
        
        //Add command to Cache
        commands[commandID] = cmd;
    }

    //Register new command to Database
    else {
        //Check for duplicatation
        if (findCommandByName(cmd.commandName)) {
            c.warn(`${Warning} Command clashes with already loaded command`);
            return;
        }

        //Confirm all aliases are only used by this command
        try {
            cmd.aliases.forEach(alias => {
                const row = findAlias.get(alias);
                if (row) {
                    const clashCommand = findCommand.pluck().get(row.commandID);
                    c.warn(`${Warning} Alias ${alias} clashes with command ${clashCommand}`);
                    throw "Command has duplicate aliases";
                }
            });
        } catch (e) {
            return;
        }

        //Create Database Entries
        const insertCommand = db.prepare("INSERT INTO chat_commands(commandName, options, enabled, modOnly, domain, content, description, builtFromFile) VALUES (?,?,?,?,?,?,?,1)");
        const info = insertCommand.run(
            cmd.commandName,
            JSON.stringify(cmd.options),
            cmd.enabled ? 1 : 0,
            cmd.modOnly ? 1 : 0,
            domainString,
            cmd.reply,
            cmd.description
        );
        if(checkDBInfo(info))//All good. Cache it
            commands[info.lastInsertRowid] = cmd;
        
        //Save aliases
        const insertAlias = db.prepare("INSER INTO command_alias(commandID, aliasName) VALUES (@id,?)").bind({id:info.lastInsertRowid});
        try {
            cmd.alias.forEach(alias => {
                const result = insertAlias.run(alias);
                if (checkDBInfo(result))//All good. Cache it
                    commandAliases[alias] = info.lastInsertRowid;
                else throw "Command has duplicate aliases";
            });
        } catch (e) {
            c.warn(`${Warning} Failed to store aliases`);
        }
    }
}
function validateModule(filePath) {
    /*  Section 1
     *  Validate Path & Load module
     */

    //Remove . at start of ./
    //Remove leading path and split at folders
    //Ensure it is a .js file
    const pathRe=/(\/commands\/)(\w*\/)*([\w-]+\.js)/gi; //Matches Filename as one Group
    //const pathRe=/(\/commands\/)(\w*\/)*(\w+)+(\.js)/gi;  //Old. splits filetype out

    var groups = filePath.split(pathRe);

    //If the Match failed the path was invalid
    if (groups?.length <=1) return null;
    
    //Remove leading and trailing crap
    //Remove unmatched optional Groups
    groups = groups.slice(1,-1).filter( Boolean );

    //Create absolute include path
    const absolutePath = path.join(__dirname,...groups);
    //Load the .js file
    var cmdModule = require(absolutePath);

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
    if (!cmdModule.data.options.length)
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
    cmdModule.aliases = new Set(cmdModule.aliases);

    //If it had no function defined, add one
    if (!cmdModule.callback) 
        cmdModule.callback = async () => {};
    if (!cmdModule.discordCallback)
        cmdModule.discordCallback = async () => {};
    if (!cmdModule.twitchCallback)
        cmdModule.twitchCallback = async () => {};

    //Treat commandName as an alias of itself for faster Lookups
    cmdModule.data.aliases = [...cmd.aliases,cmd.commandName];

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
function parseDatabase() {
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
        if(commands[k]) {
            c.warn(`Can't load command ${v.commandName}: Command clashes with already loaded command`);
            continue;
        }
        commands[k] = v;
    }
    for(const [k,v] of Object.entries(tmpAliases)) {
        if(commandAliases[k]) {
            c.warn(`Can't load alias ${k}: Alias clashes with already loaded alias`);
            continue;
        }
        commandAliases[k] = v;
    }
}

//Probably needs a bunch of work
function dispatch(commandName, args) {
    //Find Command
    const commandID = findCommandByName(commandName);
    if (!commandID) return null;

    const cmd = commandObjects[commandID];
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
        return null;
    }
}

exports.init = init;

//De-de-de-DEPRECATED
//Ya yeet!
class CommandHandler {
    static #instance;
    #commandObjects = [];   //Old

    #commands = [];
    #commandAliases = [];

    constructor() {
        this.#instance = this;
        const start = hrtime.bigint();
        //Load command files
        this.#parseFiles();

        //Load database commands
        this.#parseDatabase();

        //Say something impressive
        const elapsed = Math.floor((hrtime.bigint() - start) / 1e6) //ms time
        c.inf(`Loaded ${this.#commands.length} commands(${this.#commandAliases.length} Aliases) in ${elapsed}ms.`)
    }

    static get() {
        if (this.#instance === undefined)
            return new CommandHandler();
        return this.#instance;
    }

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

    #parseFiles() {
        //Read in Files in command paths and push valid ones onto the Array
        //Validate each script file
        //Register good commands
        var commandFiles = [];
        commandPaths.forEach(path=> {
            const files = fs.readdirSync(path).filter(file => file.endsWith('.js'));
            commandFiles.push(files);
        });

        for (const file of commandFiles) {
            const command = this.#validateModule(`/commands/${file}`);
            if (!command) {
                c.warn('Failed to load command file: '+file);
                continue;
            }
            this.#registerFileCommand(command);
        }
    }

    #registerFileCommand(cmd) {
        //Check if it's already registered in the Database
        //Yes: Update data fields and aliases
        //No: Save to DB

        const getID = db.prepare("SELECT commandID FROM chat_commands WHERE commandName = ?");
        const findCommand = db.prepare("SELECT commandName,builtFromFile FROM chat_commands WHERE commandID = ?");
        const findAlias = db.prepare("SELECT aliasID, commandID FROM command_alias WHERE aliasName = ?");

        const Warning = `Can't load command ${cmd.commandName}:`

        //Try to find in DB
        const commandID = getID.pluck().get(cmd.commandName);

        const domainString = `{"twitch":${cmd.isTwitchCommand},"discord":${cmd.isDiscordCommand}}`;

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
            if(this.#commands[commandID] || this.#findCommandByName(cmd.commandName)) {
                c.warn(`${Warning} Command clashes with already loaded command`);
                return;
            }

            //Confirm the DB row is a file command
            const isFileCommand = findCommand.get(commandID);
            if (isFileCommand.isBuiltin == 0) {
                c.warn(`${Warning} Command clashes with existing entry`);
                return;
            }

            //Confirm all aliases are only used by this command
            try {
                cmd.aliases.forEach(alias => {
                    const row = findAlias.get(alias);
                    if (row?.commandID != commandID) {
                        const clashCommand = findCommand.pluck().get(row.commandID);
                        c.warn(`${Warning} Alias ${alias} clashes with command ${clashCommand}`);
                        throw "Command has duplicate aliases";
                    }
                });
            } catch (e) {
                return;
            }

            //Fetch enable status from DB
            const isEnabled = db.prepare("SELECT enabled FROM chat_commands WHERE commandID = ?").pluck().get(commandID);
            cmd.enabled = isEnabled == 0 ? false : true;

            //Overwrite Database entry with current Data
            const updateCommand = db.prepare("UPDATE chat_commands SET options=?, modOnly=?, domain=?, content=?, description=? WHERE commandID = @id");
            const info = updateCommand.run(
                {id: commandID},
                JSON.stringify(cmd.options),
                cmd.modOnly ? 1 : 0,
                domainString,
                cmd.reply,
                cmd.description
            );
            checkDBInfo(info);


            //Update Aliases
            const insertAlias = db.prepare(`INSERT INTO command_alias(commandID, aliasName) VALUES(@id,?)`).bind({id: commandID});

            cmd.aliases.forEach(alias => {
                const row = findAlias.get(alias);
                //Only cache alias if already in place
                if (row) {
                    this.#commandAliases[alias] = commandID;
                    return;
                }
                //Insert if new
                const result = insertAlias.run(alias);

                if (checkDBInfo(result))//All good. Cache it
                    this.#commandAliases[alias] = commandID;
            });
            
            //Add command to Cache
            this.#commands[commandID] = cmd;
        }

        //Register new command to Database
        else {
            //Check for duplicatation
            if (this.#findCommandByName(cmd.commandName)) {
                c.warn(`${Warning} Command clashes with already loaded command`);
                return;
            }

            //Confirm all aliases are only used by this command
            try {
                cmd.aliases.forEach(alias => {
                    const row = findAlias.get(alias);
                    if (row) {
                        const clashCommand = findCommand.pluck().get(row.commandID);
                        c.warn(`${Warning} Alias ${alias} clashes with command ${clashCommand}`);
                        throw "Command has duplicate aliases";
                    }
                });
            } catch (e) {
                return;
            }

            //Create Database Entries
            const insertCommand = db.prepare("INSERT INTO chat_commands(commandName, options, enabled, modOnly, domain, content, description, builtFromFile) VALUES (?,?,?,?,?,?,?,1)");
            const info = insertCommand.run(
                cmd.commandName,
                JSON.stringify(cmd.options),
                cmd.enabled ? 1 : 0,
                cmd.modOnly ? 1 : 0,
                domainString,
                cmd.reply,
                cmd.description
            );
            if(checkDBInfo(info))//All good. Cache it
                this.#commands[info.lastInsertRowid] = cmd;
            
            //Save aliases
            const insertAlias = db.prepare("INSER INTO command_alias(commandID, aliasName) VALUES (@id,?)").bind({id:info.lastInsertRowid});
            try {
                cmd.alias.forEach(alias => {
                    const result = insertAlias.run(alias);
                    if (checkDBInfo(result))//All good. Cache it
                        this.#commandAliases[alias] = info.lastInsertRowid;
                    else throw "Command has duplicate aliases";
                });
            } catch (e) {
                c.warn(`${Warning} Failed to store aliases`);
            }
        }
    }

    #validateModule (filePath) {
        /*  Section 1
         *  Validate Path & Load module
         */

        //Remove . at start of ./
        //Remove leading path and split at folders
        //Ensure it is a .js file
        const pathRe=/(\/commands\/)(\w*\/)*([\w-]+\.js)/gi; //Matches Filename as one Group
        //const pathRe=/(\/commands\/)(\w*\/)*(\w+)+(\.js)/gi;  //Old. splits filetype out

        var groups = filePath.split(pathRe);

        //If the Match failed the path was invalid
        if (groups?.length <=1) return null;
        
        //Remove leading and trailing crap
        //Remove unmatched optional Groups
        groups = groups.slice(1,-1).filter( Boolean );

        //Create absolute include path
        const absolutePath = path.join(__dirname,...groups);
        //Load the .js file
        var cmdModule = require(absolutePath);

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
        if (!cmdModule.data.options.length)
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
        cmdModule.aliases = new Set(cmdModule.aliases);

        //If it had no function defined, add one
        if (!cmdModule.callback) 
            cmdModule.callback = async () => {};
        if (!cmdModule.discordCallback)
            cmdModule.discordCallback = async () => {};
        if (!cmdModule.twitchCallback)
            cmdModule.twitchCallback = async () => {};

        //Treat commandName as an alias of itself for faster Lookups
        cmdModule.data.aliases = [...cmd.aliases,cmd.commandName];

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


    //Old
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

    //Old
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
            const query = `INSERT INTO chat_commands(commandName,options,modOnly,domain,content,description) VALUES (?,?,?,?,?,?)`;
            const info = db.prepare(query).run([
                commandName,
                cmd.getOptions(),
                cmd.isModOnly() ? 1 : 0,
                JSON.stringify(domain),
                cmd.getReply(),
                cmd.getDesc()
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

    //Old
    registerCommand(command) {
        const name = command.getName();

        //Check if already exists
        const dupe = this.#getCommandByName(name);
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

exports.CommandHandler = CommandHandler;

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

