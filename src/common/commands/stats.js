const db = require('better-sqlite3')('./src/db/sqlite.db');
const instances = require('../index.js').Instances;
const Emitter = instances.Emitter;


/**
 * Track how many messages everyone sent
 */
const incrementM = db.prepare("UPDATE stats_messages_sent SET lastSeen = current_timestamp, numMessages = numMessages + 1 WHERE userID = ?");
const insertM = db.prepare("INSERT INTO stats_messages_sent(userID) VALUES(?)");
const existsM = db.prepare("SELECT userID FROM stats_messages_sent WHERE userID = ?").pluck();
function incCounterM(uID) {
    if (existsM.get(uID)) {
        incrementM.run(uID);
    } else {
        insertM.run(uID);
    }
}
/**
 * Track how many redeems everyone got
 */
 const incrementR = db.prepare("UPDATE stats_redeems_got SET sumTotal = sumTotal + ?, lastSeen = current_timestamp, numRedeems = numRedeems + 1 WHERE userID = ?");
 const insertR = db.prepare("INSERT INTO stats_redeems_got(userID,sumTotal) VALUES(?,?)");
 const existsR = db.prepare("SELECT userID FROM stats_redeems_got WHERE userID = ?").pluck();
 function incCounterR(uID, points) {
     if (existsR.get(uID)) {
         incrementR.run(points,uID);
     } else {
         insertR.run(uID,points);
     }
 }
/**
 * Track how many whispers everyone sent
 */
 const incrementW = db.prepare("UPDATE stats_whispers_sent SET lastSeen = current_timestamp, numMessages = numMessages + 1 WHERE userID = ?");
 const insertW = db.prepare("INSERT INTO stats_whispers_sent(userID) VALUES(?)");
 const existsW = db.prepare("SELECT userID FROM stats_whispers_sent WHERE userID = ?").pluck();
 function incCounterW(uID) {
     if (existsW.get(uID)) {
         incrementW.run(uID);
     } else {
         insertW.run(uID);
     }
 }

Emitter.on('TwitchMessage', (Emitter, clients, channel, user, message, messageObject) => { incCounterM(messageObject.userInfo.userId) });
Emitter.on('TwitchRedeem', (Emitter, Clients, Message)=> { incCounterR(Message.userId, Message.rewardCost) });
Emitter.on('LinkRequest', (id)=> { incCounterW(id) });

exports.data = {
    commandName: 'stats',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    replyInDMs: false,
    description: "Get someone's stats",
    discordOptions: [{
        name: "user",
        description: "Twitch username",
        type: "STRING",
        required: true
    }]
}

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
 exports.discordCallback = async (Emitter, Clients, interaction) => {

    const user = interaction.options.get("user")?.value;

    var profile = null;
    if (args) {
        const nameRe = /^@?(?<usr>\w+) */gi
        const groups = nameRe.exec(args).groups
        user = groups ? groups.usr : null;
    }
    profile = await getData(user);
    if (!profile) {
        Clients.twitch.chat.say(ch, `No stats found for ${user}`, {replyTo: msgObj});
        return;
    }

    const lastSeen = profile.lastSeen ? profile.lastSeen.toDateString() : null;
    const lastChat = lastSeen ? `They were last in chat on ${lastSeen}!` : `They have never been in this chat!`;
    const reply = `@${profile.name} has sent ${profile.msgSent} messages and received ${profile.redeemsGot} redeems for ${profile.pointsSpent} total points. ${lastChat}`;    
    interaction.reply(reply);
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
exports.twitchCallback = async (Emitter, Clients, ch, user, choice, args, msgObj) => {
    if(!ch) return;

    var profile = null;
    if (args) {
        const nameRe = /^@?(?<usr>\w+) */gi
        const groups = nameRe.exec(args).groups
        user = groups ? groups.usr : null;
    }
    profile = await getData(user);
    if (!profile) {
        Clients.twitch.chat.say(ch, `No stats found for ${user}`, {replyTo: msgObj});
        return;
    }

    const lastSeen = profile.lastSeen ? profile.lastSeen.toDateString() : null;
    const lastChat = lastSeen ? `They were last in chat on ${lastSeen}!` : `They have never been in this chat!`;
    const reply = `@${profile.name} has sent ${profile.msgSent} messages and received ${profile.redeemsGot} redeems for ${profile.pointsSpent} total points. ${lastChat}`;
    Clients.twitch.chat.say(ch, reply, {replyTo: msgObj});
    
}

var cm;
const cache_ttl = 60 //Time in seconds; 300 = 5 Minutes
var profilecache = [];
async function getData(user) {
    if (!cm) {
        cm = await import('../../www/api/common.mjs');
        cm = cm.default;
    }

    const cache = profilecache[user];
    if (cache) return cache;

    const usr = await getUser(user);
    if (!usr) return null;
    profilecache[user] = usr;

    //Delete after end of ttl
    setTimeout(()=> {
        delete profilecache[user];
    },cache_ttl*1000);
    return usr;
}

const msgInfo = db.prepare("SELECT numMessages, lastSeen FROM stats_messages_sent WHERE userID = ?");
const redeemInfo = db.prepare("SELECT sumTotal, numRedeems FROM stats_redeems_got WHERE userID = ?");
const linkInfo = db.prepare("SELECT numMessages FROM stats_whispers_sent WHERE userID = ?");

async function getUser(name) {
    const user = await cm.getUserInfoName(name);
    if (!user) return null;
    const id = user.id;

    const msgData = msgInfo.get(id);
    const msgSent = msgData ? msgData.numMessages : 0;
    const lastSeen = msgData ? new Date(msgData.lastSeen) : null;

    const pointsData = redeemInfo.get(id);
    const pointsSpent = pointsData ? pointsData.sumTotal : 0;
    const redeemsGot = pointsData ? pointsData.numRedeems : 0;

    const linkData = linkInfo.get(id);
    const linksRequested = linkData ? linkData.numMessages : 0;

    const profile = {
        userID: id,
        name: user.displayName,
        avatar: user.profilePictureUrl,
        lastSeen,
        msgSent,
        pointsSpent,
        redeemsGot,
        linksRequested
    };
    return profile;
}