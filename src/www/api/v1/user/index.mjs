import { Router } from 'express';
import cm from '../../common.mjs';
import moment from 'moment';

const router = Router();

const msgInfo = cm.db.prepare("SELECT numMessages, lastSeen FROM stats_messages_sent WHERE userID = ?").pluck().get;
const redeemInfo = cm.db.prepare("SELECT sumTotal, numRedeems FROM stats_redeems_got WHERE userID = ?").pluck().get;
const linkInfo = cm.db.prepare("SELECT numMessages FROM stats_whispers_sent WHERE userID = ?").pluck().get;

async function getUser(name) {
    const user = await cm.getUserInfoName(name);
    if (!user) return null;
    const id = user.id;

    //FollowAge
    const streamer = await cm.getStreamer();
    const follow = await user.getFollowTo(streamer);
    var followAge = null;
    if (follow) 
        followAge = moment(follow.followDate.getTime()).fromNow(true);

    const streakInfo = await cm.getStreakByName(name);
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

router.get('/:username', async (req, res) => {
  if (!req.params.username) {
    req.body.message = new Error('Provide a twitch username at /api/v1/user/:username');
    return res.status(400).send(req.body);
  }
  const profile = await getUser(req.params.username);
  if (!profile) {
    req.body.message = new Error(req.params.username + ' could not be found');
    return res.status(400).send(req.body);
  }
  return res.status(200).json(profile);
});

export default router;