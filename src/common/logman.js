const moment = require('moment');
const path = require('path');
const fs = require('fs');
const conf = require('./../../conf/general.json').logs;
const logpath = path.resolve('./logs/');

const process = require('process');

/*
 *  Validate Configuration 
 */
const levels = conf.loglevels?.length > 0 ? conf.loglevels : ["debug", "info", "warning", "error", "none"];
var level_console = levels.includes(conf.loglevel_console) ? conf.loglevel_console : levels[0];
var level_outFile = levels.includes(conf.loglevel_file) ? conf.loglevel_file : levels[0];
var trace_path = conf.always_trace === undefined ? true : conf.always_trace;
var add_timestamp = conf.add_timestamp === undefined ? true : conf.add_timestamp;
var log_to_file = conf.log_to_file === undefined ? true : conf.log_to_file;
const currentFilename = logpath + '/' + createFilename();

/*
 *  Interface Config Functions
 */
function setLogLevel(outSelect = "console", loglevel = 0) {
    var new_level = levels.includes(loglevel) ? loglevel : levels[0];
    switch (outSelect) {
        case "console":
            level_console = new_level;
            break;
        case "file":
            level_outFile = new_level;
            break;
    }
}
function setTrace(traceEnable) {
    if (traceEnable === undefined) trace_path = true;
    else trace_path = traceEnable;
}
function setEnableTimeStamp(timeEnable) {
    if (timeEnable === undefined) timeEnable = true;
    else add_timestamp = timeEnable;
}
function setOutFile(fileEnable) {
    if (fileEnable === undefined) fileEnable = true;
    else log_to_file = fileEnable;
}

/*
 *  Logging functions
 */
function log(message, messageLevel = "") {
    sendConsole(message, messageLevel);
    sendFile(message, messageLevel);
}
function logFile(message, messageLevel = "") {
    sendFile(message, messageLevel);
}
function debug(message) {
    const level = levels[0];
    if(shouldPrint("console",level))
        sendConsole(message,level);
    if(shouldPrint("file",level))
        sendFile(message,level);
}
function inf(message) {
    const level = levels[1];
    if(shouldPrint("console",level))
        sendConsole(message,level);
    if(shouldPrint("file",level))
        sendFile(message,level);
}
function warn(message) {
    const level = levels[2];
    if(shouldPrint("console",level))
        sendConsole(message,level);
    if(shouldPrint("file",level))
        sendFile(message,level);
}
function err(message) {
    const level = levels[3];
    if(shouldPrint("console",level))
        sendConsole(message,level);
    if(shouldPrint("file",level))
        sendFile(message,level);
}

/*
 *  Exports
 */
exports.setLogLevel = setLogLevel;
exports.setTrace = setTrace;
exports.setEnableTimeStamp = setEnableTimeStamp;
exports.setOutFile = setOutFile;

exports.log = log;
exports.logFile = logFile;
exports.debug = debug;
exports.inf = inf;
exports.warn = warn;
exports.err = err;
exports.CurrentLogFile = currentFilename;

//  ----------------------------------
//  Implementation Functions
//  ----------------------------------

/*
 *  Determine File to write To
 */
function createFilename(i = 0) {
    const date = moment().format("YY-MM-DD");
    var filename = `${date}_${i}.log`;

    const files = fs.readdirSync(logpath);
    const isUnique = files.every(file => 
        file != filename
    );

    if (!isUnique)
        return createFilename(++i);
    else
        return filename;
}

/*
 *  Send Message
 */

function sendFile(message, messageLevel) {
    if (!log_to_file) return;
    var output = "";

    //Add timestamp and trailing space
    if(add_timestamp) {
        output += "[" + moment().format('HH:mm:ss') + "] ";
    }
    
    switch (messageLevel) {
        case levels[0]:  //debug
            output += "Debug: "; //Tag text
            break;
        case levels[1]:  //info
            output += "Info: "; //Tag text
            break;
        case levels[2]:  //warning
            output += "Warning: "; //Tag text
            break;
        case levels[3]:  //error
            output += "Error: "; //Tag text
            break;
        default: //Custom Prefix in other cases
            output += messageLevel+": ";
            break;
    }

    //Add call origin for Error messages or if flag is enabled
    const shouldTrace = trace_path || levels.indexOf(messageLevel) >= 3;
    if (shouldTrace) {
        output += getTrace();
        output += " ";
    }
    output += message;
    output += "\n";
    writeToFile(output);
}

function sendConsole(message, messageLevel) {
    var output = "";

    //Add timestamp and trailing space
    if(add_timestamp) {
        const timetag = "[" + moment().format('HH:mm:ss') + "]";
        
        output += "\x1b[47m"; //font white
        output += "\x1b[40m"; //highlight black
        output += timetag; //add time tag
        output += "\x1b[0m"; //reset font
        output += " "; //append space after tag
    }
    
    switch (messageLevel) {
        case levels[0]:  //debug
            output += "\x1b[24m"; //enable underline
            output += "\x1b[30m"; //font black
            output += "\x1b[102m"; //highlight green
            output += "Debug:"; //Tag text
            output += "\x1b[0m"; //reset font
            output += " "; //append space after tag
            break;
        case levels[1]:  //info
            output += "\x1b[4m"; //enable underline
            output += "\x1b[30m"; //font black
            output += "\x1b[46m"; //highlight cyan
            output += "Info:"; //Tag text
            output += "\x1b[0m"; //reset font
            output += " "; //append space after tag
            break;
        case levels[2]:  //warning
            output += "\x1b[4m"; //enable underline
            output += "\x1b[30m"; //font black
            output += "\x1b[43m"; //highlight yellow
            output += "Warning:"; //Tag text
            output += "\x1b[0m"; //reset font
            output += " "; //append space after tag
            break;
        case levels[3]:  //error
            output += "\x1b[4m"; //enable underline
            output += "\x1b[47m"; //font white
            output += "\x1b[41m"; //highlight red
            output += "Error:"; //Tag text
            output += "\x1b[0m"; //reset font
            output += " "; //append space after tag
            break;
        default: //Custom Prefix in other cases
            output += messageLevel+": ";
            break;
    }

    //Add call origin for Error messages or if flag is enabled
    const shouldTrace = trace_path || levels.indexOf(messageLevel) >= 3;
    if (shouldTrace) {
        output += getTrace();
        output += " ";
    }

    console.log(output, message);
}


//aux functions

/**
* @return {bool} - True when set loglevel is at or higher than needed.
* @param {string} outSelect - One of "console" or "file".
* @param {string} messageLevel - loglevel of the message to send.
*/
function shouldPrint(outSelect = "console", messageLevel) {
    var verbosity = 0;
    switch (outSelect) {
        case "console":
            verbosity = levels.indexOf(level_console);
            break;
        case "file":
            verbosity = levels.indexOf(level_outFile);
            break;
    }
    return verbosity <= levels.indexOf(messageLevel);
}

function getTrace() {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const callee = new Error().stack[3];
    Error.prepareStackTrace = originalPrepareStackTrace;
    const relativeFileName = path.relative(process.cwd(), callee.getFileName());
    const prefix = `@${relativeFileName}:${callee.getLineNumber()}`;
    return prefix
}

var logStream;
function writeToFile(message) {
    if(!logStream) {
        logStream = fs.createWriteStream(currentFilename, { flags: 'a' });
    }
    logStream.write(message);
}