import { Instances } from '../../common/index.js';
const db = Instances.DB.database;

import {getStreakByName } from '../../common/commands/streak.js';

import { Getters } from '../../twitch/index.js';

const getUserInfoName = Getters.getUserInfoName;
const getStreamer = Getters.getStreamer;
const getUserInfoID = Getters.getUserInfoID;

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
async function topStreaks(page, page_size) {
    const top = await leaderBoard(page, page_size);
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

const getBest = db.prepare("SELECT userID, streakCount, achievedAt FROM twitch_redeem_records ORDER BY streakCount DESC");
const getTop = db.prepare("SELECT userID, streakCount FROM twitch_redeem_streak ORDER BY streakCount DESC");

var tableCache = null;
const cache_ttl = 30; //Cache lifetime in seconds
function getLB_Table()  {
    if (!tableCache) {
        var r1 = getTop.all();
        var r2 = getBest.all();
        tableCache = [...r1, ...r2].sort((a,b)=>b.streakCount-a.streakCount);
        setTimeout(()=>{tableCache = null;},cache_ttl*1000)
    }
    return tableCache;
}

async function leaderBoard(page, page_size) {
    const table = getLB_Table();
    if (!table || table.length==0) return null;
    var LB = [];
    const length = Math.min(table.length, page*page_size);
    let i = Math.min(table.length, (page-1)*page_size);
    for(; i < length; i++) {
        let row = table[i];
        const user = await Getters.getUserInfoID(row.userID);
        LB.push({
            name: user.displayName,
            streak: row.streakCount,
            achieved: row.achievedAt ? row.achievedAt : "Still active"
        });
    }
    LB.sort((a,b)=> b.streak-a.streak);

    return LB;
}

export default {
    db,
    getUserInfoName,
    getStreamer,
    getUserInfoID,
    getStreakByName,
    parseResult,
    topStreaks
}
