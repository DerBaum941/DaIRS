const app = require('express')();
const apiPort = 80;

const db = require('better-sqlite3')('./src/db/sqlite.db');

//Streak info
const streaks = require('../../common/commands/streak.js');
const leaderBoard = streaks.leaderBoard;
const getUserInfoName = streaks.getUserInfoName;
const getStreamer = streaks.getStreamer;
const getUserInfoID = streaks.getUserInfoID;
const getStreakByName = streaks.getStreakByName;

async function topStreaks(numRows) {
    const top = await leaderBoard(numRows);
    var lb = [];
    if (!top || top.length == 0) return lb;
    top.forEach(row => {
        lb.push({
            name: row.name,
            value: row.streak,
            active: row.achieved
        });
    });
    lb.sort((a,b)=> b.value-a.value);
    return lb;
}

//Messages info
const getTopMessages = db.prepare("SELECT userID, numMessages AS value FROM stats_messages_sent ORDER BY value DESC LIMIT ?").all;
async function topMessages(numRows) {
    const result = getTopMessages(numRows);
    const lb = await parseResult(result, numRows);
    return lb;
}

//Redeem Points info
const getTopPoints = db.prepare("SELECT userID, sumTotal AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ?").all;
async function topPoints(numRows) {
    const result = getTopPoints(numRows);
    const lb = await parseResult(result, numRows);
    return lb;
}

//Redeem Count info
const getTopRedeems = db.prepare("SELECT userID, numRedeems AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ?").all;
async function topRedeems(numRows) {
    const result = getTopRedeems(numRows);
    const lb = await parseResult(result, numRows);
    return lb;
}

//Whisper Count info
const getTopWhispers = db.prepare("SELECT userID, numMessages AS value FROM stats_whispers_sent ORDER BY value DESC LIMIT ?").all;
async function topWhispers(numRows) {
    const result = getTopWhispers(numRows);
    const lb = await parseResult(result, numRows);
    return lb;
}

//give key value pair
async function parseResult(result, numRows) {
    var lb = [];
    if (result.length == 0)
        return lb;
    for(let i = 0; i < result.length; i++) {
        let row = result[i];
        const user = await getUserInfoID(row.userID);
        lb.push({
            name: user.displayName,
            value: row.value
        });
    }
    lb.sort((a,b)=> b.value-a.value );

    lb = lb.slice(0, Math.min(lb.length, numRows-1));

    return lb;
}


const moment = require('moment');

const msgInfo = db.prepare("SELECT numMessages, lastSeen FROM stats_messages_sent WHERE userID = ?").pluck().get;
const redeemInfo = db.prepare("SELECT sumTotal, numRedeems FROM stats_redeems_got WHERE userID = ?").pluck().get;
const linkInfo = db.prepare("SELECT numMessages FROM stats_whispers_sent WHERE userID = ?").pluck().get;

async function getUser(name) {
    const user = await getUserInfoName(name);
    if (!user) return null;
    const id = user.id;

    //FollowAge
    const streamer = await getStreamer();
    const follow = await user.getFollowTo(streamer);
    var followAge = null;
    if (follow) 
        followAge = moment(follow.followDate.getTime()).fromNow(true);

    const streakInfo = await getStreakByName(name);
    const streakCount = streakInfo ? streakInfo.streak : null;
    const streakActive = streakInfo ? streakInfo.active : null;

    const msgData = msgInfo(id);
    const msgSent = msgData ? msgData.numMessages : 0;
    const lastSeen = msgData ? new Date(msgData.lastSeen).toJSON() : null;

    const pointsData = redeemInfo(id);
    const pointsSpent = pointsData ? pointsData.sumTotal : 0;
    const redeemsGot = pointsData ? pointsData.numRedeems : 0;

    const linkData = linkInfo(id);
    const linksRequested = linkData ? linkData.numMessages : 0;

    const profile = {
        userID: id,
        name: user.displayName,
        avatar: user.profilePictureUrl,
        isFollow: follow ? true : false,
        followAge,
        lastSeen,
        streakCount,
        streakActive,
        msgSent,
        pointsSpent,
        redeemsGot,
        linksRequested
    };
    return profile;
}

app.get('/api/lb', (req, res) => {
    switch(req.path) {
        case '/streak':

        break;
        case '/message':

        break;
        case '/points':

        break;
        case '/redeems':

        break;
        case '/links':

        break;
    }
});

app.get('/api/user', (req,res) => {
    const profile = getUser(req.path);
    //Invalid search
    if (!profile) {
        //Decline request?
    }
});