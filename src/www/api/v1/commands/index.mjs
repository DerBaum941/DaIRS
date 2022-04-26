import { Router } from 'express';
import cm from '../../common.mjs';
const router = Router();

const getLike = cm.db.prepare(`SELECT commandName AS name, countUsed AS used, content AS value, description, enabled FROM chat_commands WHERE commandName LIKE %?% ORDER BY commandName ASC`).all;

//Either command name or list
router.get('/:commandName', (req, res) => {
  if (!req.params.commandName) {
    const all = getLike('');
    return res.status(200).json(all);
  }
    const search = getLike(req.params.commandName);
    return res.status(200).json(search);
});


const getLikeRep = cm.db.prepare(`SELECT commandName AS name, countUsed AS used, content AS value, description, enabled FROM chat_commands WHERE content LIKE %?% ORDER BY content ASC`).all;

router.get('/reply/:searchText', (req, res) => {
  if (!req.params.searchText) {
    const all = getLike('');
    return res.status(200).json(all);
  }
    const search = getLikeRep(req.params.searchText);
    return res.status(200).json(search);
});

export default router;