const c = require('../common/logman.js');
const express = require('express');


//const webApp = express();
//const webAppPort = 80;

var callbacks;

const oauthApp = require('./oauth.js');

async function init(conf, instance) {
    callbacks = instance;
    //c.inf("Websocket Online");
    
    await oauthApp.init(instance);

    return;
    return new Promise(res => setTimeout(res,100));
}
exports.init = init;
/*
webApp.get('/', (req, res) => {
    res.send('Hello World!');
});

webApp.listen(webAppPort, () => {
    c.inf(`Generic Webapp @ ${webAppPort}`);
});
*/