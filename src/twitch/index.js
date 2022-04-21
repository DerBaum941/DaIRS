const path = require('path')
const fs = require('fs')
const c = require('./../common/logman.js')
const { RefreshingAuthProvider } = require('@twurple/auth');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { BasicPubSubClient, PubSubClient } = require('@twurple/pubsub');

var botID;
var botPrefix;
var channels;

var authorizedChannels = [];
var apiAuthorizers = [];

var chatClient, apiClient, pubSubClient;

let globalAuth;
var clientId, clientSecret;
var instances;



/*
 *  Initializer
 */

async function init(conf,callbacks) {
    instances = callbacks;
    botID = conf.selfID;
    botPrefix = conf.commandPrefix;
    channels = conf.channels;

    //Config Parse
    const authpath = path.normalize(__dirname + './../../conf/credentials.json');
    const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).twitch;
    clientId = auth.clientID;
    clientSecret = auth.clientSecret;

    //API Client
    globalAuth = new ClientCredentialsAuthProvider(clientId, clientSecret);

    apiClient = new ApiClient({ authProvider: globalAuth });

    c.inf("Twitch API Client initialized");

    await initalizeChannels();

    await initChatClient();

    //TODO:
    //ADD PubSub & EventSub Clients
    const clients = {chat: chatClient, api: apiClient};

    instances.Emitter.on('NewTwitchAuth', newAuthCallback);

    //Relay Events :)
    chatClient.onMessage(async (channel, user, message, msg) => {
        instances.Emitter.emit('TwitchMessage', instances.Emitter, clients, channel, user, message, msg);
    });
    chatClient.onWhisper(async (user, message, msg)=>{
        instances.Emitter.emit('TwitchWhisper', instances.Emitter, clients, user, message, msg);
    });

    return new Promise(res=>setTimeout(res,100));
}

async function initalizeChannels() {
    return new Promise(res => {
        instances.DB.database.prepare('SELECT userID FROM twitch_auth_tokens').pluck().all().forEach(async userID=>{
            const user = await apiClient.users.getUserById(userID);
            authorizedChannels.push(user.name);
        });
        setTimeout(res,1000);
    });
}


function initChatClient() {
    const queryData = instances.DB.findRow("twitch_auth_tokens","userID",botID);

    if(!queryData) {
        c.warn("[Twitch] Couldn't find User Access Token. Retrying");
        return new Promise(res => {
            setTimeout(async ()=>{
                await initChatClient();
                res(1);
            },2000);
        });
    }

    const data =
        {
            "accessToken": queryData.accessToken,
            "refreshToken": queryData.refreshToken,
            "expiresIn": queryData.expiresIn,
            "obtainmentTimestamp": queryData.obtainmentTimestamp,
            "scope": JSON.parse(queryData.scope)
        };

    const authProvider = new RefreshingAuthProvider({
        clientId,
        clientSecret,
        onRefresh: authRefreshCallback(botID)
    }, data);

    chatClient = new ChatClient({authProvider: authProvider, channels:authorizedChannels, requestMembershipEvents: true, isAlwaysMod: true});

    chatClient.onRegister(registerCallback);

    chatClient.onMessage(messageCallback);

    chatClient.onWhisper(whisperCallback);

    chatClient.connect();

    return new Promise( res=>setTimeout( ()=>res(1),1000 ) );
}

/*
 *  Module exports
 */

exports.init = init;
exports.isStreamLive = isStreamLive;

/*
 *  Callback Functions
 */

async function registerCallback() {
    c.debug(`Connecting to channels ${authorizedChannels.toString()}`);
    c.inf("Connected to Twitch Chat as " + chatClient.currentNick);
}

async function whisperCallback(user, message, msgObj) {
    c.debug(`[Whisper] ${user}: ${message}`);
}

async function messageCallback(channel, user, message, msgObj) {
    if(user.userId === botID || message.startsWith(botPrefix)) return;
    
    const args = message.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    
    if (command === "ping")
        chatClient.say(channel, 'Pong!');

    if (command === "pepemods") {
        const mdos = await chatClient.getMods(channel);
        chatClient.say(channel, "The mods are " + mdos );
    }

    c.debug(`[Twitch] [${channel}] ${user}: ${message}`);
}

function AuthRefreshCallback(data,userID) {
    const DBdata= {
        "userID": userID, 
        "accessToken": data.accessToken, 
        "refreshToken": data.refreshToken,
        "expiresIn": data.expiresIn,
        "obtainmentTimestamp": data.obtainmentTimestamp,
        "scope": JSON.stringify(data.scope)
    }
    instances.DB.upsert("twitch_auth_tokens", DBdata);
}
//High five to higher order functions
const authRefreshCallback = (userId) => { userId = userId || botID;
    return function (data) { AuthRefreshCallback(data,userId); };
}

function newAuthCallback(data) {
    c.debug("New Token Added");
    const tokenData = {
        "accessToken": data.accessToken,
        "refreshToken": data.refreshToken,
        "expiresIn": 0,
        "obtainmentTimestamp": 0,
        "scope": null
    };

    apiAuthorizers[data.id] = new RefreshingAuthProvider({
        clientId,
        clientSecret,
        onRefresh: authRefreshCallback(data.id)
    }, tokenData);
    apiAuthorizers[data.id].refresh();
}


/*
 *  Aux Functions
 */

//Apiclient
async function isStreamLive(userName) {
	const user = await apiClient.users.getUserByName(userName);
	if (!user) {
		return false;
	}
	return await user.getStream() !== null;
}