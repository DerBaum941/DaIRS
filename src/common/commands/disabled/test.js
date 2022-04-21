const path = require('path');

const pathExample = "./src/common/commands/test/more/file.js/trailingbullshit"
const minimal = '/commands/example.js'
const badPath = "./test/runthis.exe"
const pathRe=/(\/commands\/)(\w*\/)*(\w+)+(\.js)/gi;
const pathRe2 = /(\/commands\/)(\w*\/)*([\w-]+\.js)/gi;
const out = minimal.split(pathRe2).slice(1,-1).filter( Boolean );
const fixed = path.join(__dirname,...out);
//console.log(fixed);

//var cmdModule = require('./example.js');
//console.log(cmdModule.callback)
//if (!cmdModule.callback) console.log("test");

const test = undefined;
//if (!test || test?.exports == {}) console.log('yes');

const a = ['a','b'];
const trueth = a.every(i=> typeof i === "string" );
//console.log(JSON.stringify(a));

const b = new Set([1,2,2]);
//b.forEach(f=>console.log(f))

const domainString = `{"twitch":true,"discord":false}`;
const logthis = JSON.parse(domainString);
//console.log(logthis.discord === false);

const a2 = '\\comm\\b\\af.js'
const res = a2.split(path.sep);
//console.log(res)

//console.log(path.resolve('a','./b'))

const commandRe = /(?<prefix>^.)(?<cmd>\w+)? *(?<args>.+)*/g;
const str = "!cmd add yello You stink!";
console.log(commandRe.exec(str).groups.args);