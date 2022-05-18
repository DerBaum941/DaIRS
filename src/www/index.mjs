import c from '../common/logman.js';
import Express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


var callbacks;
var conf;
import oauthApp from './oauth.js';

async function init(cnf, instance) {
    callbacks = instance;
    conf = cnf;
    
    await oauthApp.init(cnf,instance);

const app = Express();
const options = {
  dotfiles: 'ignore',
  extensions: ['htm', 'html'],
  index: 'index.html',
};

var corsOptions = {
  origin: cnf.cors_allowed_domains,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

//Api Route
const apiRoutes = await import('./api/index.mjs');
app.use('/api', apiRoutes.default.v1);

//Mod dashboard
const dashboard = await import('./mod/router.mjs');
app.use('/mod', dashboard.default);

//Giving it the User Token
app.use('/auth', oauthApp.router);

//Make assets url-able
app.use('/files', Express.static(path.join(__dirname, 'static/assets'), options));

//Main Landing page
app.use('/', Express.static(path.join(__dirname, 'static'), options));


//Send to react router anyways
app.use('*', (req,res)=>{
  res.sendFile(path.join(__dirname, 'static/index.html'));
});

//Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
  next();
})

app.listen(cnf.port);




    return new Promise(res => setTimeout(res,100));
}
export default {
  init
};