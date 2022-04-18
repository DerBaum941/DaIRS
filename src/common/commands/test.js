const path = require('path');

const pathExample = "./src/common/commands/test/more/file.js/trailingbullshit"
const minimal = '/commands/example.js'
const badPath = "./test/runthis.exe"
const pathRe=/(\/commands\/)(\w*\/)*(\w+)+(\.js)/gi;
const pathRe2 = /(\/commands\/)(\w*\/)*([\w-]+\.js)/gi;
const out = minimal.split(pathRe2).slice(1,-1).filter( Boolean );
const fixed = path.join(__dirname,...out);
console.log(fixed);

var cmdModule = require('./example.js');
console.log(cmdModule.callback)
if (!cmdModule.callback) console.log("test");

const test = undefined;
if (!test || test?.exports == {}) console.log('yes');

const a = ['a','b'];
const trueth = a.every(i=> typeof i === "string" );
console.log(JSON.stringify(a));

const b = new Set([1,2,2]);
b.forEach(f=>console.log(f))