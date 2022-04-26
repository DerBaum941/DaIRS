import { Router } from 'express';
import cm from '../../common.mjs';
const router = Router();

const rowDefault = 20;

//Most messages sent info
const getTopMessages = cm.db.prepare("SELECT userID, numMessages AS value FROM stats_messages_sent ORDER BY value DESC LIMIT ?").all;
async function topMessages(numRows) {
    const result = getTopMessages(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Redeem Points info
const getTopPoints = cm.db.prepare("SELECT userID, sumTotal AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ?").all;
async function topPoints(numRows) {
    const result = getTopPoints(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Redeem Count info
const getTopRedeems = cm.db.prepare("SELECT userID, numRedeems AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ?").all;
async function topRedeems(numRows) {
    const result = getTopRedeems(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Whisper Count info
const getTopWhispers = cm.db.prepare("SELECT userID, numMessages AS value FROM stats_whispers_sent ORDER BY value DESC LIMIT ?").all;
async function topWhispers(numRows) {
    const result = getTopWhispers(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Top used commands info
const getTopCommands = cm.db.prepare("SELECT commandName AS name, content AS value, countUsed AS used, description, enabled FROM chat_commands ORDER BY value DESC LIMIT ?").all;
async function topCommands(numRows) {
    const result = getTopCommands(numRows);
    var lb = [];
    if (result.length == 0)
      return lb;
    lb.sort((a,b)=> b.used-a.used );
    return lb;
}
//Top used triggers info
const getTopTriggers = cm.db.prepare("SELECT triggerName, reply AS value, countUsed AS used FROM twitch_chat_triggers ORDER BY value DESC LIMIT ?").all;
async function topTriggers(numRows) {
    const result = getTopTriggers(numRows);
    var lb = [];
    if (result.length == 0)
      return lb;
    lb.sort((a,b)=> b.used-a.used );
    return lb;
}

router.get('/triggers/:rows', (req, res) => {
    const lb = cm.topTriggers(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/streak/:rows', async (req, res) => {
    const lb = await cm.topStreaks(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/redeems/:rows', async (req, res) => {
    const lb = await cm.topRedeems(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/points/:rows', async (req, res) => {
    const lb = await cm.topPoints(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/message/:rows', async (req, res) => {
    const lb = await cm.topMessages(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/links/:rows', async (req, res) => {
    const lb = await cm.topWhispers(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/commands/:rows', (req, res) => {
    const lb = cm.topCommands(req.params.rows || rowDefault);
    return res.status(200).json(lb);
});

router.get('/', (req, res) => {
    return res.status(404).send();
  });

export default router;