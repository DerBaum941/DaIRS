import Express from 'express';
import {Router} from 'express';
import routesV1 from './v1/index.mjs';
const router = Router();

router.use(Express.json());
router.use(Express.urlencoded({ extended: true}));

router.use('/v1/user', routesV1.user);
router.use('/v1/stats', routesV1.stats);
router.use('/v1/commands', routesV1.commands);

export default {
    v1: router
};