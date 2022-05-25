const path = require('path')
const fs = require('fs')
const c = require('./../common/logman.js')
const { RefreshingAuthProvider } = require('@twurple/auth');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { BasicPubSubClient, PubSubClient } = require('@twurple/pubsub');

var botID, mods, channel, redeemID;

//var authorizedChannels = [];
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
    
    instances.Emitter.on('NewTwitchAuth', newAuthCallback);

    return new Promise(res => {
        instances.Emitter.on('TwitchInitComplete',res);
        instances.Emitter.on('TwitchAllAuths', initChatClient);

        initAuths();
    });
    //TODO:
    //EventSub Client
}

async function initAuths() {
    const queryData = instances.DB.database.prepare("SELECT * FROM twitch_auth_tokens").all();

    if(!queryData || queryData.length == 0) {
        c.warn("[Twitch] Couldn't find Token Data. Retrying");
        setTimeout(initAuths,5000);
        return false;
    }

    queryData.forEach(row => {
        //authorizedChannels.push(user.name);

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

    instances.Emitter.emit('TwitchAllAuths');
    return true;

}

async function initChatClient() {
    const authProvider = apiAuthorizers[botID];

    if(!authProvider || apiAuthorizers.length == 0) {
        c.warn("[Twitch] Couldn't find User Access Token. Retrying");
        setTimeout(initAuths,5000);
        return false;
    }
    c.inf("Twitch Token Managing initialized");

    chatClient = new ChatClient({authProvider: authProvider, channels:[channel], requestMembershipEvents: true, isAlwaysMod: true});

    chatClient.isMod = (username) => {
        return mods.includes(username);
    }
    chatClient.isModByID = async (user) => {
        const id = await apiClient.users.getUserByID(user);
        return chatClient.isMod(id.name);
    }

    chatClient.onRegister(registerCallback);

    await chatClient.connect();

    //Relay Events :)
    chatClient.onMessage(async (channel, user, message, msg) => {
        msg.timestamp = Date.now();
        instances.Emitter.emit('TwitchMessage', instances.Emitter, clients, channel, user, message, msg);
    });
    chatClient.onWhisper(async (user, message, msg) => {
        msg.timestamp = Date.now();
        instances.Emitter.emit('TwitchWhisper', instances.Emitter, clients, user, message, msg);
    });
    chatClient.sendToStreamer = (content) => { chatClient.say(channel, content); return; };

    var clients = { chat: chatClient, api: apiClient }
    clients = initPubSub(clients);

    exports.sendToStream = (content) => { chatClient.say(channel, content); return; };

    exports.Clients = { chat: chatClient, api: apiClient, pubsub: pubSubClient, channel: channel };

    instances.Emitter.emit('TwitchInitComplete');

    return true;
}

function initPubSub(clients) {
    
    pubSubClient = new PubSubClient();
    clients.pubsub = pubSubClient;

    apiAuthorizers.forEach(auth => {
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
    c.debug(`Connecting to channels ${channel}`);
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
*   Caching requests
*/

async function getData(ID) {
    var usr = null;
    try {
        usr = await apiClient.users.getUserById(ID);
    } catch {
        return null;
    }
    if (!usr) return null;
}

var cacheObjectsID = [];
var cacheObjectsName = [];
class CacheObject {
    static objectCount = 0;

    #ttl = 30; //Time in seconds between periodic invalidation
    #refreshes = 5; //Number of hits before invalidation

    #max_lifetime = 60 //Time in minutes with no requests to clear memory
    #count_softlimit = 500; //Number of cache instances (roughly)
    #min_lifetime = 30 //Idle lifetime if Memory is in high demand

    #Data;

    #timer;
    #lastHit = Date.now();
    #hits = this.#refreshes;

    constructor(data) {
        this.#Data = data;
        this.objectCount++;

        this.#timer = setTimeout(this.#onInvalidate,this.#ttl*1000);
    }
    get() {
        this.#onRead();
        return this.#Data;
    }

    #onRead() {
        this.#lastHit = Date.now();
        if (--this.#hits == 0) {
            this.#onInvalidate();
        } else {
            this.#timer.refresh();
        }
    }

    #onInvalidate() {
        const currLifetime = this.objectCount >= this.#count_softlimit ? this.#max_lifetime*60 : this.#min_lifetime;

        if (Date.now()-this.#lastHit >= currLifetime*1000) {
            cacheObjectsID[this.#Data.id] = null;
            cacheObjectsName[this.#Data.name] = null;
            this.objectCount--;
            return;
        }

        //Read data in again
        getData(this.#Data.id).then(data => {
            this.#Data = data;
            this.#timer.refresh();
            this.#hits = this.#refreshes;
        });
    }
}

const getUserInfoID = async (ID) => {
    const cache = cacheObjectsID[ID];

    if (cache)
        return cache.get();

    const usr = await getData(ID);
    c.debug("Cache miss:");
    c.debug(usr);
    if (!usr) return null;

    const cacheman = new CacheObject(usr);
    cacheObjectsID[ID] = cacheman;
    cacheObjectsName[usr.name] = cacheman;

    return usr;
}

const getUserInfoName = async (name) => {
    if (!name) return null;
    name = name.toLowerCase();

    const cache = cacheObjectsName[name];
    if (cache) 
        return cache.get();

    var usr = null;
    try {
        usr = await apiClient.users.getUserByName(name);
    } catch {
        return null;
    }
    if (!usr) return null;

    const cacheman = new CacheObject(usr);
    cacheObjectsID[ID] = cacheman;
    cacheObjectsName[usr.name] = cacheman;

    return usr;
}
const getStreamer = async () => {
    const usr = await getUserInfoName(channel);
    return usr;
}

exports.Getters = {getStreamer, getUserInfoID, getUserInfoName};

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