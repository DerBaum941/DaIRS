const jobs = require('./scheduled.js');
const c = require('./logman.js');
var instances = {};
instances.Emitter = require('./event.js').Emitter;
instances.DB = require('./../db/index.js');
instances.Twitch = require('./../twitch/index.js');

async function init(conf) {

    /*
     *  Basic Connectors
     */

    //Initialize Database
    await instances.DB.init(conf.db, instances);
    //Initialize Websocket
    instances.WWW = await import('../www/index.mjs');
    await instances.WWW.default.init(conf.www, instances);
    
    //Initialize Twitch
    await instances.Twitch.init(conf.twitch, instances);
    
    //Initialize Discord
    instances.Discord = require('./../discord/index.js');
    await instances.Discord.init(conf.discord, instances);
    //Initialize Twitter
    //instances.Twitter = require('./../twitter/index.js');
    //await instances.Twitter.init(conf.twitter, instances);
    await aBit();

    /*
     *  Additional Modules & Functionality
     */
    instances.Commands = require('./commandHandler.js')(instances);
    await aBit();

    instances.redeemStreaks = require('./redeem_streak.js');
    instances.redeemStreaks.init(conf.twitch, instances);

    instances.linkWhispers = require('./link_whispers.js');
    instances.linkWhispers.init(conf, instances);

    instances.statAPI = await import('../www/api/index.mjs');
    
   c.inf("Completed initialization of "+conf.project_name);
}

exports.Init = init;
exports.Instances = instances;

async function aBit() {return new Promise(res=>setTimeout(res,1000));}