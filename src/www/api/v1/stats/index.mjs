import { Router } from 'express';
import cm from '../../common.mjs';
const router = Router();

const rowDefault = 20;

//Most messages sent info
const getTopMessages = cm.db.prepare("SELECT userID, numMessages AS value FROM stats_messages_sent ORDER BY value DESC LIMIT ?");
async function topMessages(numRows) {
    const result = getTopMessages.all(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Redeem Points info
const getTopPoints = cm.db.prepare("SELECT userID, sumTotal AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ?");
async function topPoints(numRows) {
    const result = getTopPoints.all(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Redeem Count info
const getTopRedeems = cm.db.prepare("SELECT userID, numRedeems AS value FROM stats_redeems_got ORDER BY value DESC LIMIT ?");
async function topRedeems(numRows) {
    const result = getTopRedeems.all(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Whisper Count info
const getTopWhispers = cm.db.prepare("SELECT userID, numMessages AS value FROM stats_whispers_sent ORDER BY value DESC LIMIT ?");
async function topWhispers(numRows) {
    const result = getTopWhispers.all(numRows);
    const lb = await cm.parseResult(result, numRows);
    return lb;
}

//Top used commands info
const getTopCommands = cm.db.prepare("SELECT commandName AS name, content AS value, countUsed AS used, description, enabled, modOnly FROM chat_commands ORDER BY used DESC LIMIT ?");
function topCommands(numRows) {
    const result = getTopCommands.all(numRows);
    if (result.length == 0)
      return [];
    //lb.push(...result);
    //lb.sort((a,b)=> b.used-a.used );
    return result;
}
//Top used triggers info
const getTopTriggers = cm.db.prepare("SELECT triggerName, reply AS value, countUsed AS used FROM twitch_chat_triggers ORDER BY value DESC LIMIT ?");
function topTriggers(numRows) {
    const result = getTopTriggers.all(numRows);
    if (result.length == 0)
      return [];
    //lb.sort((a,b)=> b.used-a.used );
    return result;
}

router.get('/triggers/:rows?', (req, res) => {
    const lb = topTriggers(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/streak/:rows?', async (req, res) => {
    const lb = await cm.topStreaks(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/redeems/:rows?', async (req, res) => {
    const lb = await topRedeems(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/points/:rows?', async (req, res) => {
    const lb = await topPoints(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/message/:rows?', async (req, res) => {
    const lb = await topMessages(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/links/:rows?', async (req, res) => {
    const lb = await topWhispers(req.params.rows || rowDefault);
    return res.status(200).json(lb);
  });
router.get('/commands/:rows?', (req, res) => {
    const lb = topCommands(req.params.rows || rowDefault);
    return res.status(200).json(lb);
});

router.get('/', (req, res) => {
    return res.status(404).send();
  });

export default router;