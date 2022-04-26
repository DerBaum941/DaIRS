import Express from 'express';
import c from '../../common/logman.js';
import routesV1 from './v1/index.mjs';
const app = new Express();

const apiPort = 8080;


app.use(Express.json());
app.use(Express.urlencoded({ extended: true}));
app.use((req, res, done) => {
    //Do something, count requests 
});

app.get('/api/v1/user', routesV1.user);
app.get('/api/v1/stats', routesV1.stats);
app.get('/api/v1/commands', routesV1.commands);

app.listen(apiPort, () => c.inf("Stats API running on Port "+apiPort));