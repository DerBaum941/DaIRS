var instances;
var db;
var sendMessage = true;
const c = require('./logman.js');

var lastStreamStart = null;
const hoursBetweenStreams = 12;

async function init(conf, callbacks) {
    instances = callbacks;
    db = instances.DB.database;

    //Doesn't exist, so find a workaraound:

    //instances.Emitter.on('TwitchStreamStart',(channel)=>{
    //    if (channel != "DaishuTV") return;
    //});

    const getStreak = db.prepare("SELECT streakCount FROM twitch_redeem_streak WHERE userID = ?").pluck();

    instances.Emitter.on('StreakToggle', (enable) => {
        sendMessage = enable;
    });

    instances.Emitter.on('TwitchRedeem', (Emitter, Clients, Message)=> {
        onAnyRedeem(Message);
    });

    instances.Emitter.on('TwitchRedeem', (Emitter, Clients, Message)=> {
        if (Message.rewardId == conf.redeem_streak_reward_id) {
            onRedeem(Message.userId);
            if (!sendMessage) return;
            
            const streak = getStreak.get(Message.userId);
            instances.Twitch.sendToStream(`${Message.userDisplayName} has paid their Taxes ${streak} times in a row!`);
            return;
        }
        //This is a Workaround because fuck eventsubs
        if (Message.rewardId == conf.stream_start_redeem) {
            onStreamEnd();
            c.inf(`${Message.userDisplayName} has redeemed first!`);
            
            var pastTime = new Date(new Date().getTime() - (hoursBetweenStreams * 60 * 60 * 1000));
            if (lastStreamStart == null || lastStreamStart <= pastTime)
                setTimeout(onStreamStart,500);
            lastStreamStart = new Date();
            return;
        }
    });
}
exports.init = init;

function onStreamStart() {
    c.inf("A new stream has started!");
    db.prepare("UPDATE twitch_redeem_streak SET streakActive = 0").run();
}

function onStreamEnd() {
    db.prepare("UPDATE twitch_redeem_streak SET streakCount = IIF(streakActive = 1, streakCount, 0)").run();
}

function onAnyRedeem(redemptionMessage) {
    const entry = db.prepare("SELECT * FROM twitch_redeem_stats WHERE rewardID = ?").pluck().get(redemptionMessage.rewardId);
    const useDate = redemptionMessage.redemptionDate.toLocaleString('en-GB', { timeZone: 'UTC' });
    if(entry) {
        db.prepare("UPDATE twitch_redeem_stats SET rewardName = ?, redeemCount = redeemCount + 1, totalPoints = totalPoints + ?, lastUsed = ? WHERE rewardID = ?")
        .run(redemptionMessage.rewardTitle, redemptionMessage.rewardCost, useDate, redemptionMessage.rewardId);
    } else {
        db.prepare("INSERT INTO twitch_redeem_stats(rewardID,rewardName,redeemCount,totalPoints,lastUsed) VALUES(?,?,1,?,?)")
        .run(redemptionMessage.rewardId, redemptionMessage.rewardTitle, redemptionMessage.rewardCost, useDate);
    }
}

//Add toggleable response message

function onRedeem(userID) {
    //Check if user already exists
    const result = db.prepare("SELECT * FROM twitch_redeem_streak WHERE userID = ?").get(userID);
    if (result) 
        //Increment Counter and set streak to active
        db.prepare("UPDATE twitch_redeem_streak SET streakCount = streakCount + 1, streakActive = 1 WHERE userID = ?").run(userID);
    else 
        //Create row with 1 redeem
        db.prepare("INSERT INTO twitch_redeem_streak(userID, streakCount, streakActive) VALUES(?,?,?)").run(userID,1,1);
}