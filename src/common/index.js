const jobs = require('./scheduled.js');
const c = require('./logman.js');
var instances = {};

async function init(conf) {

    instances.Emitter = require('./event.js').Emitter;
    
    /*
     *  Basic Connectors
     */

    //Initialize Database
    instances.DB = require('./../db/index.js');
    await instances.DB.init(conf.db, instances);
    //Initialize Websocket
    instances.WWW = require('./../www/index.js');
    await instances.WWW.init(conf.www, instances);
    
    //Initialize Twitch
    instances.Twitch = require('./../twitch/index.js');
    await instances.Twitch.init(conf.twitch, instances);
    
    //Initialize Discord
    instances.Discord = require('./../discord/index.js');
    await instances.Discord.init(conf.discord, instances);
    //Initialize Twitter
    //instances.Twitter = require('./../twitter/index.js');
    //await instances.Twitter.init(conf.twitter, instances);

    /*
     *  Additional Modules & Functionality
     */
    instances.Commands = require('./commandHandler.js')(instances);
    instances.redeemStreaks = require('./redeem_streak.js');
    instances.redeemStreaks.init(conf.twitch, instances);
    
   c.inf("Completed initialization of "+conf.project_name);
}

exports.Init = init;
exports.Instances = instances;