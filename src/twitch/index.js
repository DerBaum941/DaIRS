const path = require('path')
const fs = require('fs')
const c = require('./../common/logman.js')
const { RefreshingAuthProvider } = require('@twurple/auth');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { BasicPubSubClient, PubSubClient } = require('@twurple/pubsub');

var botID, mods, channel, redeemID;

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
    mods = conf.mods;

    channel = conf.channel;
    redeemID = conf.redeem_streak_reward_id;

    //Config Parse
    const authpath = path.normalize(__dirname + '../../../conf/credentials.json');
    const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).twitch;
    clientId = auth.clientID;
    clientSecret = auth.clientSecret;

    //API Client
    globalAuth = new ClientCredentialsAuthProvider(clientId, clientSecret);

    apiClient = new ApiClient({ authProvider: globalAuth });

    c.inf("Twitch API Client initialized");

    await initAuths();

    await initChatClient();

    const clients = initPubSub({chat: chatClient, api: apiClient});

    //TODO:
    //EventSub Clients

    instances.Emitter.on('NewTwitchAuth', newAuthCallback);

    //Relay Events :)
    chatClient.onMessage(async (channel, user, message, msg) => {
        msg.timestamp = Date.now();
        instances.Emitter.emit('TwitchMessage', instances.Emitter, clients, channel, user, message, msg);
    });
    chatClient.onWhisper(async (user, message, msg)=>{
        msg.timestamp = Date.now();
        instances.Emitter.emit('TwitchWhisper', instances.Emitter, clients, user, message, msg);
    });

    chatClient.sendToStreamer = async (content) => {return chatClient.say(channel, content);}

    exports.sendToStream = chatClient.sendToStreamer;

    exports.Clients = {chat: chatClient, api: apiClient, pubsub: pubSubClient, channel: channel};

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

async function initAuths() {
    const queryData = instances.DB.database.prepare("SELECT * FROM twitch_auth_tokens").all();

    if(!queryData) {
        c.warn("[Twitch] Couldn't find User Access Token. Retrying");
        return new Promise(res => {
            setTimeout(async ()=>{
                await initAuths();
                res(1);
            },2000);
        });
    }

    queryData.forEach(async row => {
        const user = await apiClient.users.getUserById(row.userID);
        authorizedChannels.push(user.name);

        const data = {
            "accessToken": row.accessToken,
            "refreshToken": row.refreshToken,
            "expiresIn": row.expiresIn,
            "obtainmentTimestamp": row.obtainmentTimestamp,
            "scope": JSON.parse(row.scope)
        };
        apiAuthorizers[row.userID] = new RefreshingAuthProvider({
            clientId,
            clientSecret,
            onRefresh: authRefreshCallback(row.userID)
        }, data);
    });

    c.inf("Twitch Token Managing initialized");
    //c.debug("Pausing process due to rate limiting");

    return new Promise(res=>setTimeout(res,2000));
}

function initChatClient() {
    const authProvider = apiAuthorizers[botID];

    if(!authProvider) {
        c.warn("[Twitch] Couldn't find User Access Token. Retrying");
        return new Promise(res => {
            setTimeout(async ()=>{
                await initAuths();
                await initChatClient();
                res(1);
            },2000);
        });
    }

    chatClient = new ChatClient({authProvider: authProvider, channels:authorizedChannels, requestMembershipEvents: true, isAlwaysMod: true});

    chatClient.isMod = (username) => {
        return mods.includes(username);
    }
    chatClient.isModByID = async (user) => {
        const id = await apiClient.users.getUserByName(user);
        return chatClient.isMod(id.name);
    }

    chatClient.onRegister(registerCallback);

    chatClient.connect();

    return new Promise(res=>setTimeout(res,1000));
}

async function initPubSub(clients) {
    
    pubSubClient = new PubSubClient();
    clients.pubsub = pubSubClient;

    apiAuthorizers.forEach(async (auth)=> {
        pubSubClient.registerUserListener(auth).then((id) => {
            addPubSubEvents(id,clients);
        });
    });
    
    c.inf("Twitch Pub/Subs initialized");
    return clients;
}
function addPubSubEvents(userID,clients) {
    pubSubClient.onRedemption(userID, async (message) => {
        instances.Emitter.emit('TwitchRedeem', instances.Emitter, clients, message);
    });
    /*
    pubSubClient.onBits(userID, async (message) => {
        instances.Emitter.emit('TwitchBits', instances.Emitter, clients, message);
    });
    pubSubClient.onSubscription(userID, async (message) => {
        instances.Emitter.emit('TwitchSub', instances.Emitter, clients, message);
    });
    */
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