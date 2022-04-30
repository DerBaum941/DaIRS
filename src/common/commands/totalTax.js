const { Getters } = require('../../twitch/index.js');
const db = require('better-sqlite3')('./src/db/sqlite.db');

exports.data = {
    commandName: 'streaktotal',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    aliases: ['taxsum','taxtotal'],
    replyInDMs: false,
    description: "Get someone's Tax Total",
    discordOptions: [{
        name: "user",
        description: "Twitch username",
        type: "STRING",
        required: false
    }]
}

const getAllActive = db.prepare("SELECT streakCount FROM twitch_redeem_streak").pluck();
const getAllHistoric = db.prepare("SELECT streakCount FROM twitch_redeem_records").pluck();
function getTaxTotal() {
    var counts = getAllActive.all();
    counts.push(...getAllHistoric.all());
    const sum = counts.reduce((partial, a)=>partial + a,0);
    return sum;
}
const getActive = db.prepare("SELECT streakCount FROM twitch_redeem_streak WHERE userID = ?").pluck();
const getHistory = db.prepare("SELECT streakCount FROM twitch_redeem_records WHERE userID = ?").pluck();
async function getUserTax(username) {
    var usr = await Getters.getUserInfoName(username);
    var counts = getHistory.all(usr.id);
    counts.push(getActive.get(usr.id));
    const sum = counts.reduce((partial, a)=>partial + a,0);
    usr.TaxTotal = sum;
    return usr;
}
function getUserTaxID(id) {
    var counts = getHistory.all(id);
    counts.push(getActive.get(id));
    const sum = counts.reduce((partial, a)=>partial + a,0);
    return sum;
}

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
 exports.discordCallback = async (Emitter, Clients, interaction) => {

    const username = interaction.options.get("user")?.value;

    //If a name was provided
    if (username) {
        const usr = await getUserTax(username.toLowerCase());
        const taxNum = usr.TaxTotal;

        //If theres nothing, fail
        if (!taxNum || taxNum.length == 0) {
            interaction.reply({content: `${username} has never paid taxes!`, ephemeral: true});
            return;
        }

        //Show stats for the Person
        const reply = `${username} has paid their taxes ${taxNum} times`;
        interaction.reply(reply);
    }
    //Otherwise gimme everythin
    else {
        const taxNum = getTaxTotal();
        const reply = `A total of ${taxNum} Tax payments have been collected so far!`;
        interaction.reply(reply);
    }
}

/**
 * Twitch IRC callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {string} channel Name of the IRC channel
 * @param {string} user login_name of the Invoking user
 * @param {string?} choice The selected choice, if one was defined
 * @param {*} args String remainder of the original message, excluding commandName and choice
 * @param {*} msgObj Full IRC message object
 * @return {void}
 */
exports.twitchCallback = async (Emitter, Clients, ch, chatPerson, choice, args, msgObj) => {
    if(!ch) return;

    const nameRe = /^@?(?<usr>\w+) */gi
    const user = nameRe.exec(args);

    //Leaderboard
    if (!args) {
        const taxNum = getTaxTotal();
        const reply = `A total of ${taxNum} Tax payments have been collected so far!`;

        Clients.twitch.chat.say(ch, reply, {replyTo: msgObj});
        return;
    }

    //Invalid args
    if (!user.groups && args) {
        const taxNum = getUserTaxID(msgObj.userInfo.userId);
        const reply = `@${chatPerson} has never paid their taxes`;

        Clients.twitch.chat.say(ch, reply, {replyTo: msgObj});
        return;
    }

    //Fetch user
    const usr = await getUserTax(user.groups.usr);
    //Invalid user
    if(!usr) {
        const taxNum = getUserTaxID(msgObj.userInfo.userId);
        const reply = `@${chatPerson} has never paid their taxes`;

        Clients.twitch.chat.say(ch, reply, {replyTo: msgObj});
        return;
    }

    //Stats
    const taxNum = usr.TaxTotal;
    const text = `@${usr.displayName} has paid their taxes ${taxNum} times`;
    Clients.twitch.chat.say(ch, text, {replyTo: msgObj});
}
