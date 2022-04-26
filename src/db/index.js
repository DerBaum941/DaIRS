const c = require('../common/logman.js');
const fs = require('fs');

const db = require('better-sqlite3')('./src/db/sqlite.db');

var instances;

const tables_script = fs.readFileSync(__dirname+"\\tables.sql",'utf-8');
const create_script = fs.readFileSync(__dirname+"\\create.sql",'utf-8');

function init(conf, callbacks) {
    instances = callbacks;

    db.exec(tables_script);

    c.inf("Database loaded");

    return new Promise(res => setTimeout(()=>{res(db)},1000));
}



/**
 * Read of database Table
 * @param {string} tbl - Table to be read
 * @returns {Array} - Data of the Table
 */
function readTable(tbl){
    const stmt = db.prepare(`SELECT * FROM ?`);
    return stmt.all(tbl);
}

//UNSAFE FUNCTION
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


exports.init = init;
exports.readTable = readTable;
exports.upsert = upsert;
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