const c = require('./logman.js');
const db = require('better-sqlite3')('./src/db/sqlite.db');
const cnf = require('../../conf/general.json');
const fs = require('fs');
const path = require('path');
const { hrtime } = require('process');

//Todo
//Prune discord commands that arent used
//Prune unused in DB
//Eventually: parse things like $user


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
        //Yeah circular dependencies are fun
    }
    #init(modules) {
        const start = hrtime.bigint();
        //Load command files
        this.#parseFiles();

        //Load database commands
        this.#parseDatabase();

        try {
            this.#registerEvents(modules.Emitter, modules.Discord, modules.Twitch);
            setTimeout(()=> this.#registerCommandsToDiscord(modules.Discord.bot), 2300);
        } catch {
            throw 'You must first load this module with valid initalizers';
        }

        //this.resetAllDiscordCommands();

        this.#pruneDatabase();
        //Say something impressive
        const elapsed = (hrtime.bigint() - start) / 1000000n; //ms time
        const commandCount = Object.keys(this.#commands).length;
        const aliasCount = Object.keys(this.#commandAliases).length;
        c.inf(`Loaded ${commandCount} commands(${aliasCount-commandCount} Aliases) in ${elapsed}ms.`);
    }

    static get(...args) {
        if (this.#instance === undefined) {
            this.#instance = new CommandHandler();
            this.#instance.#init(...args);
        }
        return this.#instance;
    }

    /**
     * Registers a new Command
     * @param {string} commandName Name of command, must be globally unique
     * @param {string} reply Text to reply with on Invoke
     * @param {Object} commandOptions 
     */
    addCustomCommand(commandName, reply, { replyInDMs, modOnly, enabled, twitchEnabled, discordEnabled, description, aliases, twitchChoices, discordOptions }) {
        //Simple check for Duplicate
        if (this.#commandAliases[commandName]) {
            return false;
        }
        //Create basic command object
        const cmd = this.#validateCommand(commandName, reply, replyInDMs, modOnly, enabled, twitchEnabled, discordEnabled, description, aliases, twitchChoices, discordOptions);
        //Throw it in the DB
        //Cache it
        const result = this.#registerCommand(cmd, false);
        if (!result) {
            return false;
        }
        return true;
    }
    addCustomCommand(CommandModule) {
        if (this.#commandAliases[CommandModule.data.commandName]) {
            return false;
        }
        const cmd = this.#validateCommand(CommandModule.data.commandName,
            CommandModule.data.reply,
            CommandModule.data.replyInDMs, 
            CommandModule.data.modOnly, 
            CommandModule.data.enabled, 
            CommandModule.data.twitchEnabled, 
            CommandModule.data.discordEnabled, 
            CommandModule.data.description, 
            CommandModule.data.aliases, 
            CommandModule.data.twitchChoices, 
            CommandModule.data.discordOptions);
        const result = this.#registerCommand(cmd, false);
        if (!result) {
            return false;
        }
        return true;
    }
    /**
     * Delete a command or alias
     * @param {string} commandName Name of command or alias to delete
     * @returns {boolean} True if successfully deleted something
     */
    delCustomCommand(commandName) {
        const cmdID = this.#commandAliases[commandName];
        if (!cmdID) return false;
        if (!this.#commands[cmdID]) return false;

        const isFile = db.prepare("SELECT builtFromFile FROM chat_commands WHERE commandID = ?").pluck().get(cmdID);
        if (isFile == 1) return false;

        const changes = db.prepare("DELETE FROM chat_commands WHERE commandID = ?").run(cmdID).changes;
        c.debug(`Deleted command ${commandName} [${changes} rows affected]`);

        //Remove Aliases
        this.#commands[cmdID].data.aliases.forEach(alias => {
            delete this.#commandAliases[alias];
        });
        this.#deleteDiscordCommand(this.#commands[cmdID]);
        //Delete from Cache
        delete this.#commands[cmdID];
        return true;
    }
    enCustomCommand(commandName) {
        const cmdID = this.#findCommandByName(commandName);
        if (!cmdID) return false;
        //Find command, set enabled, load aliases + name
        this.#commands[cmdID].data.enabled = true;

        const cmd = this.#commands[cmdID]
        cmd.data.aliases.forEach(alias => {
            this.#commandAliases[alias] = cmdID;
        });
        this.#commandAliases[cmd.data.commandName] = cmdID;
        db.prepare("UPDATE chat_commands SET enabled = ? WHERE commandID = ?").run(1, cmdID);
        //Register to Discord
        this.#registerDiscordCommand(cmd);
        return true;
    }
    disCustomCommand(commandName) {
        const cmdID = this.#commandAliases[commandName];
        if (!cmdID) return false;

        //Remove Aliases
        this.#commands[cmdID].data.aliases.forEach(alias => {
            delete this.#commandAliases[alias];
        });
        this.#commands[cmdID].data.enabled = false;
        db.prepare("UPDATE chat_commands SET enabled = ? WHERE commandID = ?").run(0, cmdID);

        //Unregister to Discord
        this.#deleteDiscordCommand(this.#commands[cmdID]);
        return true;
    }
    /**
     * Add and register a basic command
     * @param {String} commandName Required, Unique: Command to call
     * @param {String} reply Required: Text to reply with
     * @param {Boolean} modOnly Optional: Default false
     * @returns {Boolean} True if command was registered sucessfully
     */
    addSimpleCommand(commandName, reply, modOnly) {
        if (this.#commandAliases[commandName]) {
            return false;
        }
        const cmd = this.#validateCommand(commandName, reply, undefined, modOnly);
        if (!cmd) return false;
        
        const success = this.#registerCommand(cmd, false);
        if (!success) return false;
        this.#registerDiscordCommand(cmd);
        return true;
    }

    /*  =======================================
     *          Callback functions
     *  =======================================
     */
    //Precompile the statement for SPEEEEEED
    #incrementUse = db.prepare("UPDATE chat_commands SET countUsed = countUsed + 1 WHERE commandID = ?");
    async #twitchMessageHandle(Emitter, Clients, channel, user, message, messageObject) {
        //Call dispatch
        //Call the specific handle
        //Reply with content | Could whisper @ the User?

        //Parse message
        const commandRe = /(?<prefix>^.)(?<cmd>\w+)? *(?<args>.+)*/g;
        var groups = commandRe.exec(message)?.groups;

        //Has the correct prefix
        if (!groups || groups.prefix != cnf.twitch.commandPrefix || !groups.cmd) return;

        //match case insensitive
        groups.cmd = groups.cmd.toLowerCase();

        //Command exists
        const commandID = this.#commandAliases[groups.cmd];
        if (!commandID) return;

        const cmd = this.#commands[commandID];

        //modCheck in channels
        if (channel && cmd.data.modOnly && (!(messageObject.userInfo.isMod || messageObject.userInfo.isBroadcaster) && !Clients.twitch.chat.isMod(user))) return;
        //Has to be on the list for whispers
        if (!channel && cmd.data.modOnly && !Clients.twitch.chat.isMod(user)) return;

        const hasChoices = cmd.data.twitchChoices.length > 0;
        const checkOnce = () => {
            //Only check if there is choices defined
            if (!hasChoices) 
                return false;
            //If there wasn't anything provided, it failed
            if (!groups.args) 
                return true;
            
            //If the provided argument string fits the Choices, it passed
            if (cmd.data.twitchChoices.some(choice => groups.args.startsWith(choice)))
                return false;
                
        }
        const sendOptionError = checkOnce();

        if (sendOptionError) {
            //switch by reply flag
            var choicesStr = "["
            cmd.data.twitchChoices.forEach(ch => choicesStr+=ch+'|');
            choicesStr = choicesStr.replace(/.$/,']');
            const errorReply = `Incorrect usage! Try: ${groups.prefix}${groups.cmd} ${choicesStr}`;
            if (channel)
                    Clients.twitch.chat.say(channel, errorReply, {replyTo: messageObject});
            /*
            if (cmd.data.replyInDMs || channel == null) {
                //Whispering to users requires verification
                //Fuck that noise man
                if (channel)
                    Clients.twitch.chat.say(channel, errorReply, {replyTo: messageObject});
                //Clients.twitch.chat.whisper(user, errorReply);
            } else {
                Clients.twitch.chat.say(channel, errorReply, {replyTo: messageObject});
            }
            */
            return;
        } 
        //If choices were defined and met, extract it
        else if (hasChoices) {
            const choiceRe = /(?<a>^\w+) ?(?<b>.*)?/i;
            const result = choiceRe.exec(groups.args);
            groups.choice = result.groups.a.toLowerCase();
            groups.parsedArgs = result.groups.b;
        }

        //Increment use Counter in the DB
        this.#incrementUse.run(commandID);

        Emitter.emit(`Command:${cmd.data.commandName}`, groups.args, Clients, Emitter);
        Emitter.emit('CommandExec', cmd.data.commandName, groups.args,  Clients, Emitter, cmd);
        Emitter.emit('TwitchCommand', cmd.data.commandName, user, channel);

        var errored = false;
        //Do the dispatch
        try { //Generic first
            await cmd.callback(Emitter, Clients, groups.args);
        } catch (e) {
            if (e != "rejected") {
                c.warn(`Failed to execute Twitch command ${cmd.data.commandName} with error:`);
                c.warn(`\t${e}`);
            }
            errored = true;
            if (channel) 
                Clients.twitch.chat.say(channel, "Provided arguments are invalid", messageObject);
        }

        try { //Twitch command
            if (hasChoices) {
                await cmd.twitchCallback(Emitter, Clients, channel, user, groups.choice, groups.parsedArgs, messageObject);
            } else {
                await cmd.twitchCallback(Emitter, Clients, channel, user, groups.choice, groups.args, messageObject);
            }
        } catch (e) {
            if (e != "rejected") {
                c.warn(`Failed to execute Twitch command ${cmd.data.commandName} with error:`);
                c.warn(`\t${e}`);
            }
            errored = true;
            if (channel)
                Clients.twitch.chat.say(channel, "Provided arguments are invalid", messageObject);
        }

        if (errored) return;
        if (!channel) return;
        //If no reply, don't reply
        if (cmd.data.reply === "" || !cmd.data.reply) return;

        Clients.twitch.chat.say(channel, cmd.data.reply, {replyTo: messageObject});
        /*
        //Reply with Content
        if (cmd.data.replyInDMs ) {
            //Whispering to users requires verification
            //Fuck that noise man
            if (channel)
                Clients.twitch.chat.say(channel, cmd.data.reply, {replyTo: messageObject});
            //Clients.twitch.chat.whisper(user, cmd.data.reply);
            //Clients.twitch.chat.say(channel ? channel : "derbaum941", `/w ${user} ${message}`);
        } else {
            
        }
        */
    }
    #twitchWhisperHandle(Emitter, Clients, user, message, messageObject) {
        //Handle commands too cause why not
        this.#twitchMessageHandle(Emitter, Clients, null, user, message, messageObject);
    }
    //Guaranteed to be a Command here
    async #discordCommandHandle(Emitter, Clients, interaction) {
        const commandID = this.#commandAliases[interaction.commandName];

        if (!commandID) {
            c.warn(`Invalid Discord Command invoked! /${interaction.commandName}`);
            interaction.reply({content: "Sorry, that didn't work", ephemeral: true});
            return;
        }
        const cmd = this.#commands[commandID];

        //modCheck; Shouldn't be necessary bc command perms but whatever
        if (cmd.modOnly && !interaction.memberPermissions.has("MANAGE_MESSAGES",true)) {
            interaction.reply({content: "You're not a Mod!", ephemeral: true});
            return;
        };

        //Increment use Counter in the DB
        this.#incrementUse.run(commandID);

        const args = /(?:^.)(?:\w+)? *(?<args>.+)*/g.exec(interaction.toString()).groups.args
        Emitter.emit(`Command:${cmd.data.commandName}`, args, Clients, Emitter);
        Emitter.emit('CommandExec', cmd.data.commandName, args,  Clients, Emitter, cmd);

        var errored = false;
        //Do the dispatch
        try { //Generic first
            await cmd.callback(Emitter, Clients, args);
        } catch (e) {
            if (e != "rejected") {
                c.warn(`Failed to execute Discord command ${cmd.data.commandName} with error:`);
                c.warn(`\t${e}`);
            }
            if (!interaction.replied) {
                interaction.reply({content: "Provided arguments are invalid", ephemeral: true});
            }
            errored = true;
        }

        try { //Discord command
            await cmd.discordCallback(Emitter, Clients, interaction);
        } catch (e) {
            if (e != "rejected") {
                c.warn(`Failed to execute Discord command ${cmd.data.commandName} with error:`);
                c.warn(`\t${e}`);
            }
            if (!interaction.replied) {
                interaction.reply({content: "Provided arguments are invalid", ephemeral: true});
            }
            errored = true;
        }

        if (errored) return;
        //If no reply, don't reply
        if (cmd.data.reply === "" || !cmd.data.reply) return;

        if (!interaction.replied) {
            interaction.reply({content: cmd.data.reply, ephemeral: cmd.data.replyInDMs});
        } else {
            //Append to reply if there already is one
            interaction.fetchReply().then(reply => interaction.editReply(`${reply.content}\n${cmd.data.reply}`));
            //Alternatively use follow up
            //interaction.followUp(cmd.data.reply);
        }
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

    /**
     * Adds a single command to Discord API
     * @param {Command} cmd Command to add to registry
     */
    #registerDiscordCommand = (cmd) => {};
    #registerDiscordCommandLogic(cmd, DiscordClient) {
        const api = DiscordClient.application.commands;
        /*
        if (cmd.data.modOnly) {
            api.create({
                name: cmd.data.commandName,
                description:cmd.data.description,
                type: "CHAT_INPUT",
                options: cmd.data.discordOptions,
                defaultPermission: false                
            }).then(applicationCommand => {
                api.permissions.add({
                    command: applicationCommand.id,
                    permissions: {
                        id: cnf.discord.modRoleID,
                        type: 1,
                        permission: true
                    }
                });
            });
        } else { */
            api.create({
                name: cmd.data.commandName,
                description:cmd.data.description,
                type: "CHAT_INPUT",
                options: cmd.data.discordOptions,
                defaultPermission: cmd.data.enabled && cmd.data.discordEnabled
            });
    }
    /**
     * Deletes a single command from the Discord API
     * @param {Command} cmd Command to delete from registry
     */
    #deleteDiscordCommand = (cmd) => {};
    #deleteDiscordCommandLogic(cmd, DiscordClient) {
        const api = DiscordClient.application.commands;
        api.create({
            name: cmd.data.commandName,
            type: "CHAT_INPUT",
            description: "I'm gonna delete this",
            defaultPermission: false
        }).then(applicationCommand=> {
            applicationCommand.delete();
        });
    }
    resetAllDiscordCommands = () => {};
    #registerCommandsToDiscord(DiscordClient) {
        this.resetAllDiscordCommands = () => {
            DiscordClient.application.commands.set([]);
            DiscordClient.guilds.cache.forEach(guild => {
                DiscordClient.application.commands.set([],guild.id);
            });
            this.#registerCommandsToDiscord(DiscordClient);
            c.inf(`Updated all Command Entries on Discord`);
        }
        this.#registerDiscordCommand = function (cmd) {
            this.#registerDiscordCommandLogic(cmd,DiscordClient);
        }
        this.#deleteDiscordCommand =  function (cmd) {
            this.#deleteDiscordCommandLogic(cmd,DiscordClient);
        }
        this.#commands.forEach(async cmd => {
            this.#registerDiscordCommand(cmd);
        });
    }
    #registerEvents(EventEmitter, Discord, Twitch) {
        const Clients = {discord: Discord.bot, twitch: Twitch.Clients};
        //Gotta do stupid wrappers because private fields stink :)
        EventEmitter.on('TwitchMessage', async (Emitter, _, channel, user, message, messageObject) => this.#twitchMessageHandle(Emitter, Clients, channel, user, message, messageObject));
        EventEmitter.on('TwitchWhisper', async (Emitter, _, user, message, messageObject) => this.#twitchWhisperHandle(Emitter, Clients, user, message, messageObject));
        //EventEmitter.on('DiscordMessage',() => this.#discordMessageHandle);  //Not implemented. Use Commands instead.
        EventEmitter.on('DiscordCommand',async (Emitter, _, interaction) => this.#discordCommandHandle(Emitter, Clients, interaction));
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
            const options = JSON.parse(row.options);
            return {
                data: {
                    enabled: row.enabled == 0 ? false : true,
                    modOnly: row.modOnly == 0 ? false : true,
                    twitchEnabled: domain.twitch,
                    discordEnabled: domain.discord,
                    commandName: row.commandName,
                    aliases: new Set(), //Gets populated later
                    twitchChoices: options.twitch,
                    discordOptions: options.discord,
                    reply: row.content,
                    replyInDMs: row.replyDM == 0 ? false : true,
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

        const length = Object.keys(tmpCommands).length;
        //Sanity check
        if (length != commandResult.length) {
            c.warn(`Failed to fetch all Custom Commands (Got ${length} of ${commandResult.length})`);
            return;
        }

        //Push Database values onto Cache fields
        for(const [k,v] of Object.entries(tmpCommands)) {
            if(this.#commands[k]) {
                c.warn(`Can't load command ${v.commandName}: Command clashes with already loaded command`);
                continue;
            }
            this.#registerDiscordCommand(v);
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
    #pruneDatabase() {
        const fileCommands = db.prepare("SELECT commandID, commandName FROM chat_commands WHERE builtFromFile = 1").all();
        const deleteCommand = db.prepare("DELETE FROM chat_commands WHERE commandID = ?");
        var deletedEntries = 0;
        fileCommands.forEach(row => {
            //If the command was already loaded, all good
            if (this.#commands[row.commandID]) return;
            //If the file didn't exist, but the name is loaded, something went wrong A LOT
            if (this.#commandAliases[row.commandName]) {
                c.err(`Invalid alias ${row.commandName} found!`);
            }
            //In this case, the row should be removed
            deleteCommand.run(row.commandID);
            deletedEntries++;
        });
        if (deletedEntries>0) {
            c.warn(`Deleted ${deletedEntries} unused commands from the Database`);
            this.resetAllDiscordCommands();
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

        const options = JSON.stringify({twitch: cmd.data.twitchChoices, discord:cmd.data.discordOptions});

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
            const updateCommand = db.prepare("UPDATE chat_commands SET options=?, enabled=?, modOnly=?, domain=?, content=?, replyDM=?, description=? WHERE commandID = @id");
            const info = updateCommand.run(
                {id: commandID},
                options,
                cmd.data.enabled ? 1 : 0,
                cmd.data.modOnly ? 1 : 0,
                domainString,
                cmd.data.reply,
                cmd.data.replyInDMs ? 1 : 0,
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
            const insertCommand = db.prepare("INSERT INTO chat_commands(commandName, options, enabled, modOnly, domain, content, replyDM, description, builtFromFile) VALUES (?,?,?,?,?,?,?,?,?)");
            const info = insertCommand.run(
                cmd.data.commandName,
                options,
                cmd.data.enabled ? 1 : 0,
                cmd.data.modOnly ? 1 : 0,
                domainString,
                cmd.data.reply,
                cmd.data.replyInDMs ? 1 : 0,
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

    #validateCommand(commandName, reply, replyInDMs, modOnly, enabled, twitchEnabled, discordEnabled, description, aliases, twitchChoices, discordOptions) {
        if(!commandName) return null;
        reply = reply !== undefined ? reply : null;
        replyInDMs = replyInDMs !== undefined ? replyInDMs : false;
        modOnly = modOnly !== undefined ? modOnly : false;
        enabled = enabled !== undefined ? enabled : true;
        twitchEnabled = twitchEnabled !== undefined ? twitchEnabled : true;
        discordEnabled = discordEnabled !== undefined ? discordEnabled : true;
        description = description !== undefined ? description : "Custom Chat Command";
    
        //If aliases is not an array, overwrite it
        if (!aliases?.length)
            aliases = [];
        //If it's not a pure array of strings, overwrite it
        if (!aliases.every(i=> typeof i === "string" ))
            aliases = [];

        //If options is not an array, overwrite it
        if (!twitchChoices?.length)
            twitchChoices = [];
        //If it's not a pure array of strings, overwrite it
        if (!twitchChoices.every(i => typeof i === "string"))
            twitchChoices = [];

        //If options is not an array, overwrite it
        if (!discordOptions?.length)
            discordOptions = [];

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
                twitchChoices: twitchChoices,
                discordOptions: discordOptions,
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

        //Create relative path so node can include it
        const relativePath = './'+path.relative(__dirname, path.resolve(filePath));
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
        
        //If config flags aren't set, put default booleans
        if (cmdModule.data.replyInDMs === undefined)
            cmdModule.data.replyInDMs = false;
        
        //If reply isn't set, make it null
        if (cmdModule.data.reply === undefined)
            cmdModule.data.reply = null;
        //If description isn't set, make it null;
        if (cmdModule.data.description === undefined)
            cmdModule.data.description = null;
        
        //If options is not an array, overwrite it
        if (!cmdModule.data.twitchChoices?.length)
            cmdModule.data.twitchChoices = [];
        //If it's not a pure array of strings, overwrite it
        if (!cmdModule.data.twitchChoices.every(i=> typeof i === "string" ))
            cmdModule.data.twitchChoices = [];

        //If options is not an array, overwrite it
        if (!cmdModule.data.discordOptions?.length)
            cmdModule.data.discordOptions = [];

        //If aliases is not an array, overwrite it
        if (!cmdModule.data.aliases?.length)
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
}

module.exports = (...args) => {
    return CommandHandler.get(...args);
};