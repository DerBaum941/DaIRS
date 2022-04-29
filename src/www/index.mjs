import c from '../common/logman.js';
import Express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Express();
const webAppPort = 9090;
const options = {
  dotfiles: 'ignore',
  extensions: ['htm', 'html'],
  index: 'index.html',
};

var corsOptions = {
  origin: 'http://dairs.derbaum.rocks/',
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

//Api Route
const apiRoutes = await import('./api/index.mjs');
app.use('/api', apiRoutes.default.v1);

//Mod dashboard
const dashboard = await import('./mod/router.mjs');
app.use('/mod', dashboard.default);

//Main Landing page
app.use('/', Express.static(path.join(__dirname, 'static'), options));


//Send to react router anyways
app.use('*', (req,res)=>{
  res.sendFile(path.join(__dirname, 'static/index.html'));
});

//Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(webAppPort);

var callbacks;

import oauthApp from './oauth.js';

async function init(conf, instance) {
    callbacks = instance;
    
    await oauthApp.init(instance);

    //c.inf("Websocket Online");

    return new Promise(res => setTimeout(res,100));
}
export default {
  init
};