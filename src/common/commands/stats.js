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
 const incrementR = db.prepare("UPDATE stats_redeems_got SET sumTotal = ?, lastSeen = current_timestamp, numRedeems = numRedeems + 1 WHERE userID = ?");
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
    }],
    reply: "under construction"
}
