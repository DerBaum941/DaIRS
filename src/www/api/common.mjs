import { Instances } from '../../common/index.js';
const db = Instances.DB.database;

import {leaderBoard, getStreakByName } from '../../common/commands/streak.js';

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

export default {
    db,
    getUserInfoName,
    getStreamer,
    getUserInfoID,
    getStreakByName,
    parseResult,
    topStreaks
}