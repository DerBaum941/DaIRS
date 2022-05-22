const db = require('better-sqlite3')('./src/db/sqlite.db');
const { MessageEmbed } = require('discord.js');

const data = {
    commandName: 'streak',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    aliases: ['taxes'],
    replyInDMs: false,
    description: "Get someone's Tax Information",
    discordOptions: [{
        name: "user",
        description: "Twitch username",
        type: "STRING",
        required: false
    }]
}
exports.data = data;

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
 exports.discordCallback = async (Emitter, Clients, interaction) => {

    const username = interaction.options.get("user")?.value;

    //If a name was provided
    if (username) {
        const record = await getStreakByName(username.toLowerCase());

        //If theres nothing, fail
        if (!record) {
            interaction.reply({content: `Couldn't find a record for ${username}`, ephemeral: true});
            return;
        }

        //Show stats for the Person
        const active = record.active ? "active" : "inactive";
        const reply = `${username} has an ${active} streak of ${record.streak}`;
        interaction.reply(reply);
    }
    //Otherwise gimme everythin
    else {
        const lb = await leaderBoard(10);
        if(lb.length == 0) {
            
            interaction.reply({content: "There are currently no streak records set.", ephemeral: true});
            return;
        }
        
        var userText = "", streakText = "", dateText = "";
        lb.forEach(record => {
            userText += record.name + '\n';
            streakText += record.streak + '\n';
            dateText += record.achieved + '\n';
        });

        const embed = new MessageEmbed()
                .setTitle("Daishu Tax Report")
                .setDescription("Here are the most responsible citizens so far:")
                .addField("Username", userText, true)
                .addField("Streak achieved", streakText, true)
                .addField("Ended on", dateText, true);

        const info = await getStreamer()
        embed.setAuthor({name: info.displayName, iconURL: info.profilePictureUrl, url:'https://twitch.tv/'+info.name});

        interaction.reply({embeds: [embed]});
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
exports.twitchCallback = async (Emitter, Clients, ch, chatPerson, choice, args, msgObj) => {
    if(!ch) return;

    const nameRe = /^@?(?<usr>\w+) */gi
    const user = nameRe.exec(args);

    //Leaderboard
    if (!args) {
        const lb = await leaderBoard(5);
        if(lb.length == 0) {
            Clients.twitch.chat.say(ch, "There are currently no streak records set.", {replyTo: msgObj});
            return;
        }

        var reply = "Current Leaderboard:";
        lb.forEach(record => {
            reply += ` | ${record.name}: ${record.streak}`;
        });

        Clients.twitch.chat.say(ch, reply, {replyTo: msgObj});
        return;
    }

    //Invalid args
    if (!user.groups && args) {
        Clients.twitch.chat.say(ch,"Couldn't find that user!", {replyTo: msgObj});
        return;
    }

    //Fetch user
    const record = await getStreakByName(user.groups.usr);
    //Invalid user
    if(!record) {
        Clients.twitch.chat.say(ch,"Couldn't find that user!", {replyTo: msgObj});
        return;
    }
    //Stats
    const active = record.active ? "active" : "inactive";
    const text = `${user.groups.usr} has an ${active} streak of ${record.streak}`;
    Clients.twitch.chat.say(ch, text, {replyTo: msgObj});
}


const { Getters } = require('../../twitch/index.js');


const getStats = db.prepare("SELECT streakCount, streakActive FROM twitch_redeem_streak WHERE userID = ?");
async function getStreakByName(name) {
    const usr = await Getters.getUserInfoName(name);
    if (!usr) return null;
    const row = getStats.get(usr.id);

    if (!row) return null;

    return {name: usr.displayName, streak: row.streakCount, active: row.streakActive == 1};
}

const getBest = db.prepare("SELECT userID, streakCount, achievedAt FROM twitch_redeem_records ORDER BY streakCount DESC LIMIT ?");
const getTop = db.prepare("SELECT userID, streakCount FROM twitch_redeem_streak ORDER BY streakCount DESC LIMIT ?");
async function leaderBoard(numRows) {
    var result1 = getTop.all(numRows);
    var result2 = getBest.all(numRows);
    const table = [...result1, ...result2];
    if (table.length==0) return null;
    var LB = [];
    for(let i = 0; i < table.length; i++) {
        let row = table[i];
        const user = await Getters.getUserInfoID(row.userID);
        LB.push({
            name: user.displayName,
            streak: row.streakCount,
            achieved: row.achievedAt ? row.achievedAt : "Still active"
        });
    }
    LB.sort((a,b)=> b.streak-a.streak );

    LB = LB.slice(0, Math.min(LB.length, numRows));

    return LB;
}
exports.getStreakByName = getStreakByName;
