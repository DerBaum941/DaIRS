const c = require('../common/logman.js');
const fs = require('fs');

const db = require('better-sqlite3')('./src/db/sqlite.db');

var instances;

const tables_script = fs.readFileSync(__dirname+"\\tables.sql",'utf-8');
const create_script = fs.readFileSync(__dirname+"\\create.sql",'utf-8');

function init(conf, callbacks) {
    instances = callbacks;

    db.exec(tables_script);

    return new Promise(res => setTimeout(()=>{res(db)},1000));
}



/**
 * Read of database Table
 * @param {string} tbl - Table to be read
 * @returns {Array} - Data of the Table
 */
function readTable(tbl){
    const stmt = db.prepare(`SELECT * FROM ${tbl}`);
    return stmt.all();
}

function overwriteTable(tbl, data) {
    const info = db.prepare(`DELETE FROM ${tbl}`).run();

    insertData(tbl, data);

    c.debug(`Overwrote ${info.changes} rows in ${tbl}`);
}

function upsert(tbl, data) {
    var i = 0;
    if (!(data.length > 0)) {   //If not Array
        data = [data];
    }

    //Insert array of rows [{col1:val1, ..},{col1:val1,...},...]
    var keyString = "";
    var vStr = "";
    for (const [k, v] of Object.entries(data[0])) {
        keyString += `\`${k}\`, `;
        vStr += '?, ';
    }
    keyString = keyString.slice(0, -2);
    vStr = vStr.slice(0, -2);

    const query = `INSERT OR REPLACE INTO ${tbl}(${keyString}) VALUES (${vStr})`;

    const stmt = db.prepare(query);
    data.forEach((row) => {
        const rowData = Object.values(row);
        const numRows = stmt.run(...rowData).changes;
        if (numRows) i += numRows;
    });

    c.debug(`Upserted ${i} rows into ${tbl}`);
}

function find(tbl, col, val) {
    const stmt = db.prepare(`SELECT * FROM ${tbl} WHERE ${col} = ?`);
    return stmt.all(val);
}
function findRow(tbl, col, val) {
    const stmt = db.prepare(`SELECT * FROM ${tbl} WHERE ${col} = ?`);
    return stmt.get(val);
}

function getQuery(query) {
    const stmt = db.prepare(query);
    return stmt.all();
}
function runQuery(query) {
    const stmt = db.prepare(query);
    return stmt.run();
}

exports.init = init;
exports.overwriteTable = overwriteTable;
exports.readTable = readTable;
exports.upsert = upsert;
exports.find = find;
exports.findRow = findRow;
exports.getQuery = getQuery;
exports.runQuery = runQuery;
exports.database = db;


function insertData(tbl, data) {
    var i = 0;

    if (!(data.length > 0)) {   //If not Array aka data = {col1:val1, ..}
        data = [data];
    }

    //Insert array of rows [{col1:val1, ..},{col1:val1,...},...]
    var keyString = "";
    var vStr = "";
    for (const [k, v] of Object.entries(data[0])) {
        keyString += `\`${k}\`, `;
        vStr += '?, ';
    }
    keyString = keyString.slice(0, -2);
    vStr = vStr.slice(0, -2);
    const query = `INSERT INTO ${tbl}(${keyString}) VALUES (${vStr})`;
    const stmt = db.prepare(query);
    data.forEach((row) => {
        const rowData = Object.values(row);
        const numRows = stmt.run(...rowData).changes;
        if (numRows) i += numRows;
    });
    
    c.debug(`Inserted ${i} rows into ${tbl}`);
}


/*
function insertRow(tbl, row) {
    var keyString = "", valueString = "";

    for(const [k, v] of Object.entries(row)) {
        keyString += `\`${k}\`, `;
        valueString += `'${v}', `;
    }

    keyString = keyString.slice(0,-2);
    valueString = valueString.slice(0,-2);

    const query = `INSERT INTO ${tbl}(${keyString}) VALUES (${valueString})`;
    
    const rows = db.prepare(query).run().changes;

    return rows;
}


function upsertRow(tbl, row) {
    var keyString = "", valueString = "";

    for(const [k, v] of Object.entries(row)) {
        keyString += `\`${k}\`, `;
        valueString += `'${v}', `;
    }

    keyString = keyString.slice(0,-2);
    valueString = valueString.slice(0,-2);

    const query = `INSERT OR REPLACE INTO ${tbl}(${keyString}) VALUES (${valueString})`;
    
    const rows = db.prepare(query).run().changes;

    return rows;
}


function insertDefaultData() {
    db.exec(create_script);
}



async function test ()
{
    await init();
    //c.inf(db.prepare('DELETE FROM twitch_auth_tokens WHERE userID = ?').run(1));
    //console.log(readTable("twitch_auth_tokens"));
    const data = findRow('twitch_auth_tokens','userID','787868521');
    const stmt = db.prepare(`SELECT * FROM twitch_auth_tokens WHERE userID = ?`);
    const data2 = stmt.get("787868521");
    c.inf(data2);
}
*/