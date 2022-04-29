import { Router } from 'express';
import cm from '../../common.mjs';
import moment from 'moment';

const router = Router();

const msgInfo = cm.db.prepare("SELECT numMessages, lastSeen FROM stats_messages_sent WHERE userID = ?");
const redeemInfo = cm.db.prepare("SELECT sumTotal, numRedeems FROM stats_redeems_got WHERE userID = ?");
const linkInfo = cm.db.prepare("SELECT numMessages FROM stats_whispers_sent WHERE userID = ?");

async function getUser(name) {
    const user = await cm.getUserInfoName(name);
    if (!user) return null;
    const id = user.id;

    //FollowAge
    const streamer = await cm.getStreamer();
    const follow = await user.getFollowTo(streamer);
    var followAge = null;
    var followMS = null;
    if (follow) {
      followAge = moment(follow.followDate.getTime()).fromNow(true);
      followMS = new Date().getTime() - follow.followDate.getTime();
    }
    

    const streakInfo = await cm.getStreakByName(name);
    const streakCount = streakInfo ? streakInfo.streak : null;
    const streakActive = streakInfo ? streakInfo.active : null;

    const msgData = msgInfo.get(id);
    const msgSent = msgData ? msgData.numMessages : 0;
    const lastSeen = msgData ? new Date(msgData.lastSeen).toJSON() : null;

    const pointsData = redeemInfo.get(id);
    const pointsSpent = pointsData ? pointsData.sumTotal : 0;
    const redeemsGot = pointsData ? pointsData.numRedeems : 0;

    const linkData = linkInfo.get(id);
    const linksRequested = linkData ? linkData.numMessages : 0;

    const profile = {
        userID: id,
        name: user.displayName,
        avatar: user.profilePictureUrl,
        isFollow: follow ? true : false,
        followAge,
        followMS,
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
  const profile = await getUser(req.params.username);
  if (!profile) {
    req.body.message = new Error(req.params.username + ' could not be found');
    return res.status(400).send(req.body);
  }
  return res.status(200).json(profile);
});

export default router;