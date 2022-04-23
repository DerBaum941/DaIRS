var instances;

async function init(conf, callbacks) {
    instances = callbacks;

    //Doesn't exist, so find a workaraound:

    //instances.Emitter.on('TwitchStreamStart',(channel)=>{
    //    if (channel != "DaishuTV") return;
    //});

    instances.Emitter.on('TwitchRedeem', (Emitter, Clients, Message)=> {
        //This is a Workaround because fuck eventsubs
        if (Message.rewardId == conf.redeem_streak_reward_id) {
            onRedeem(Message.userId);
            return;
        }
        if (Message.rewardId == conf.stream_start_redeem) {
            onStreamEnd();
            onStreamStart();
            return;
        }
    });
}

function getStreakCount(userID) {
    const count = instances.DB.prepare("SELECT streakCount FROM twitch_redeem_streak WHERE userID = ?").pluck().get(userID);
    return count ? count : 0;
}


function onStreamStart() {
    instances.DB.prepare("UPDATE twitch_redeem_streak SET `streakActive`=0").run();
}

function onStreamEnd() {
    instances.DB.prepare("UPDATE twitch_redeem_streak SET `streakCount`=IIF(`streakActive`=0, `streakCount`,0)").run();
}

function onRedeem(userID) {
    //Check if user already exists
    const result = instances.DB.prepare("SELECT * FROM twitch_redeem_streak WHERE userID = ?").get(userID);
    if (result) 
        //Increment Counter and set streak to active
        instances.DB.prepare("UPDATE twitch_redeem_streak SET streakCount = streakCount + 1, streakActive = 1 WHERE userID = ?").run(userID);
    else 
        //Create row with 1 redeem
        instances.DB.prepare("INSERT INTO twitch_redeem_streak(userID, streakCount, streakActive) VALUES(?,?,?)").run(userID,1,1);
}