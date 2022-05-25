import { Router } from 'express';
import cm from '../../common.mjs';
const router = Router();

const PAGE_SIZE = 25;

//Most messages sent info
const getTopMessages = cm.db.prepare("SELECT userID, numMessages AS value FROM stats_messages_sent ORDER BY value DESC LIMIT ? OFFSET ?");
async function topMessages(page) {
    const result = getTopMessages.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    const lb = await cm.parseResult(result, PAGE_SIZE);
    return lb;
}

//Redeem Points info
const getTopPoints = cm.db.prepare("SELECT userID, sumTotal AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ? OFFSET ?");
async function topPoints(page) {
    const result = getTopPoints.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    const lb = await cm.parseResult(result, PAGE_SIZE);
    return lb;
}

//Redeem Count info
const getTopRedeems = cm.db.prepare("SELECT userID, numRedeems AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ? OFFSET ?");
async function topRedeems(page) {
    const result = getTopRedeems.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    const lb = await cm.parseResult(result, PAGE_SIZE);
    return lb;
}

//Whisper Count info
const getTopWhispers = cm.db.prepare("SELECT userID, numMessages AS value FROM stats_whispers_sent ORDER BY value DESC LIMIT ? OFFSET ?");
async function topWhispers(page) {
    const result = getTopWhispers.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    const lb = await cm.parseResult(result, PAGE_SIZE);
    return lb;
}

//Top used commands info
const getTopCommands = cm.db.prepare("SELECT commandName AS name, content AS value, countUsed AS used, description, enabled, modOnly FROM chat_commands ORDER BY used DESC LIMIT ? OFFSET ?");
function topCommands(page) {
    const result = getTopCommands.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    if (result.length == 0)
      return [];
    return result;
}
//Top used triggers info
const getTopTriggers = cm.db.prepare("SELECT triggerName AS name, reply AS value, countUsed AS used FROM twitch_chat_triggers ORDER BY used DESC LIMIT ? OFFSET ?");
function topTriggers(page) {
    const result = getTopTriggers.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    if (result.length == 0)
      return [];
    //lb.sort((a,b)=> b.used-a.used );
    return result;
}
//Top used point redeems info
const getTopPointRedeems = cm.db.prepare("SELECT rewardName AS name, totalPoints AS value, redeemCount AS used, lastUsed FROM twitch_redeem_stats ORDER BY value DESC LIMIT ? OFFSET ?");
function redeemsUsed(page) {
    const result = getTopPointRedeems.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    if (result.length == 0)
      return [];
    //lb.sort((a,b)=> b.used-a.used );
    return result;
}

const getEvaderList = cm.db.prepare(
  `SELECT *
    FROM 
      (SELECT s.userID AS userID, r.streakCount AS value, r.achievedAt AS date
        FROM twitch_redeem_streak s, twitch_redeem_records r
        WHERE s.userID = r.userID AND s.streakActive = 0
        ORDER BY r.achievedAt DESC)
    GROUP BY userID
    ORDER BY value DESC
    LIMIT ? OFFSET ?;`);
async function evaderLB(page) {
    const result = getEvaderList.all(PAGE_SIZE, (page-1)*PAGE_SIZE);
    var lb = [];
    if (result.length == 0)
      return lb;
    for(let i = 0; i < result.length; i++) {
      let row = result[i];
      const usr = await cm.getUserInfoID(row.userID);
      lb.push({
        name: usr.displayName || "N/A",
        value: row.value,
        active: row.date
      });
    }
    lb.sort((a,b)=> b.value-a.value);
    return lb;
}

router.get('/triggers/:page?', (req, res) => {
    const page = req.params.page || 1;
    const lb = topTriggers(page);
    return res.status(200).json(lb);
  });
router.get('/streak/:page?', async (req, res) => {
    const page = req.params.page || 1;
    const lb = await cm.topStreaks(page, PAGE_SIZE);
    return res.status(200).json(lb);
  });
router.get('/redeems/:page?', async (req, res) => {
    const page = req.params.page || 1;
    const lb = await topRedeems(page);
    return res.status(200).json(lb);
  });
router.get('/points/:page?', async (req, res) => {
    const page = req.params.page || 1;
    const lb = await topPoints(page);
    return res.status(200).json(lb);
  });
router.get('/message/:page?', async (req, res) => {
    const page = req.params.page || 1;
    const lb = await topMessages(page);
    return res.status(200).json(lb);
  });
router.get('/links/:page?', async (req, res) => {
    const page = req.params.page || 1;
    const lb = await topWhispers(page);
    return res.status(200).json(lb);
  });
router.get('/commands/:page?', (req, res) => {
    const page = req.params.page || 1;
    const lb = topCommands(page);
    return res.status(200).json(lb);
});
router.get('/redeemuse/:page?', (req, res) => {
  const page = req.params.page || 1;
  const lb = redeemsUsed(page);
  return res.status(200).json(lb);
});
router.get('/evaders/:page?', async (req, res) => {
  const page = req.params.page || 1;
  const lb = await evaderLB(page);
  return res.status(200).json(lb);
});

router.get('/', (req, res) => {
    return res.status(404).send();
  });

export default router;
