var instances;
var db;
var sendMessage = true;

async function init(conf, callbacks) {
    instances = callbacks;
    db = instances.DB.database;

    //Doesn't exist, so find a workaraound:

    //instances.Emitter.on('TwitchStreamStart',(channel)=>{
    //    if (channel != "DaishuTV") return;
    //});

    instances.Emitter.on('StreakToggle', (enable) => {
        sendMessage = enable;
    });

    instances.Emitter.on('TwitchRedeem', (Emitter, Clients, Message)=> {
        //This is a Workaround because fuck eventsubs
        if (Message.rewardId == conf.redeem_streak_reward_id) {
            onRedeem(Message.userId);
            if (!sendMessage) return;


            return;
        }
        if (Message.rewardId == conf.stream_start_redeem) {
            onStreamEnd();
            setTimeout(onStreamStart,1000);
            return;
        }
    });
}
exports.init = init;

function onStreamStart() {
    db.prepare("UPDATE twitch_redeem_streak SET streakActive = 0").run();
}

function onStreamEnd() {
    db.prepare("UPDATE twitch_redeem_streak SET streakCount = IIF(streakActive = 1, streakCount, 0)").run();
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