const cron = require('node-cron');
const fs = require('fs');
const path = require ('path');
const moment = require('moment');
const conf = require('./../../conf/general.json').logs;
const c = require('./logman.js');


cron.schedule('0 0 6 * * *', day, {timezone: 'UTC'});
cron.schedule('0 0 18 * * 1', week, {timezone: 'UTC'});
cron.schedule('0 0 0 1 * *', month, {timezone: 'UTC'});

function startup() {
    //run once on launch
    pruneOldLogs();
}
startup();

function day() {
    //daily
    pruneOldLogs();
    backupDB();
}
function week() {
    //weekly
    updateDiscordCommands();
    pruneDBBackups();
}
function month() {
    //monthly
}



function pruneOldLogs() {
    const logpath = path.normalize(__dirname+'./../../logs/');
    const date = moment().subtract(conf.retentionDays, 'days').format("YY-MM-DD");
    const cutOffFile = date + ".log";
    var files = fs.readdirSync(logpath);
    files.push(cutOffFile);
    files.sort();
    var cutOff = files.indexOf(cutOffFile);
    const deleteables = files.slice(0,cutOff);
    c.debug("Deleting these Logfiles: " + deleteables.toString());
    deleteables.forEach(file => {
        const path = logpath + file;
        fs.unlinkSync(path);
    })
}

function pruneDBBackups() {
    const backups = path.resolve('./src/db/backups');
    const date = moment().subtract(conf.retentionDays, 'days').format("YY-MM-DD");
    const cutOffFile = date + ".db";

    var files = fs.readdirSync(backups);
    files.push(cutOffFile);
    files.sort();
    const cutOff = files.indexOf(cutOffFile);
    const deleteables = files.slice(0,cutOff);
    c.debug("Deleting these Logfiles: " + deleteables.toString());
    deleteables.forEach(file => {
        const path = backups + file;
        fs.unlinkSync(path);
    })
}

function backupDB() {
    const backupPath = path.resolve('./src/db/backups');
    const date = moment().format("YY-MM-DD");
    const filename = `${date}_sqlite.db`;

    const db = require('better-sqlite3')('./src/db/sqlite.db');

    db.backup(`${backupPath}\\${filename}`)
        .then(()=>{
            c.inf("Backed up the Database!");
        })
        .catch((err)=>{
            c.warn("Error Backing up Database:");
            c.warn(err);
        });
}

function updateDiscordCommands() {
    const cmdMan = require('./commandHandler.js')();
    cmdMan.resetAllDiscordCommands();
}