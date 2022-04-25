const db = require('better-sqlite3')('./src/db/sqlite.db');
const instances = require('../index.js').instances;
const Emitter = instances.Emitter;


/**
 * Track how many messages everyone sent
 */
const incrementM = db.prepare("UPDATE stats_messages_sent SET lastSeen = current_timestamp, numMessages = numMessages + 1 WHERE userID = ?").run;
const insertM = db.prepare("INSERT INTO stats_messages_sent(userID) VALUES(?)").run;
const existsM = db.prepare("SELECT userID FROM stats_messages_sent WHERE userID = ?").pluck().get;
function incCounterM(uID) {
    if (existsM(uID)) {
        incrementM(uID);
    } else {
        insertM(uID);
    }
}
/**
 * Track how many redeems everyone got
 */
 const incrementR = db.prepare("UPDATE stats_redeems_got SET sumTotal = ?, lastSeen = current_timestamp, numRedeems = numRedeems + 1 WHERE userID = ?").run;
 const insertR = db.prepare("INSERT INTO stats_redeems_got(userID,sumTotal) VALUES(?,?)").run;
 const existsR = db.prepare("SELECT userID FROM stats_redeems_got WHERE userID = ?").pluck().get;
 function incCounterR(uID, points) {
     if (existsR(uID)) {
         incrementR(points,uID);
     } else {
         insertR(uID,points);
     }
 }
/**
 * Track how many whispers everyone sent
 */
 const incrementW = db.prepare("UPDATE stats_whispers_sent SET lastSeen = current_timestamp, numMessages = numMessages + 1 WHERE userID = ?").run;
 const insertW = db.prepare("INSERT INTO stats_whispers_sent(userID) VALUES(?)").run;
 const existsW = db.prepare("SELECT userID FROM stats_whispers_sent WHERE userID = ?").pluck().get;
 function incCounterW(uID) {
     if (existsW(uID)) {
         incrementW(uID);
     } else {
         insertW(uID);
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
    }],
    reply: "under construction"
}
