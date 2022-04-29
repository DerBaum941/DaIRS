import { Router } from 'express';
import cm from '../../common.mjs';
const router = Router();

const getLike = cm.db.prepare(`SELECT commandName AS name, countUsed AS used, content AS value, description, enabled, modOnly FROM chat_commands WHERE commandName LIKE '%' || ? || '%' ORDER BY commandName ASC`);

//Either command name or list
router.get('/:commandName', (req, res) => {
    const search = getLike.all(req.params.commandName || '');
    return res.status(200).json(search);
});
router.get('/', (req, res) => {
    const all = getLike.all('');
    return res.status(200).json(all);
});


const getLikeRep = cm.db.prepare(`SELECT commandName AS name, countUsed AS used, content AS value, description, enabled, modOnly FROM chat_commands WHERE content LIKE '%' || ? || '%' ORDER BY content ASC`);

router.get('/reply/:searchText?', (req, res) => {
  if (!req.params.searchText) {
    const all = getLike.all('');
    return res.status(200).json(all);
  }
    const search = getLikeRep.all(req.params.searchText);
    return res.status(200).json(search);
});

export default router;