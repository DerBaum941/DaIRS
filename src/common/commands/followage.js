exports.data = {
    commandName: 'followage',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: true,
    replyInDMs: false,
    description: "Get very precise follow age",
    discordOptions: [{
        name: "user",
        description: "Twitch username",
        type: "STRING",
        required: true
    }]
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

    var age = await getFollowAge(username);
    if (!age) {
        interaction.reply(`${username} is not following!`);
    }

    age = formatDuration(age);

    interaction.reply(`@${user} has been following for ${age}`);
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
exports.twitchCallback = async (Emitter, Clients, ch, user, choice, args, msgObj) => {
    if(!ch) return;

    var age = null;
    if (args) {
        const nameRe = /^@?(?<usr>\w+) */gi
        const groups = nameRe.exec(args).groups
        user = groups ? groups.usr : null;
    }
    age = await getFollowAge(user);
    if (!age) {
        Clients.twitch.chat.say(ch, "Not even following Sadge", {replyTo: msgObj});
        return;
    }

    age = formatDuration(age);

    Clients.twitch.chat.say(ch, `@${user} has been following for ${age}`, {replyTo: msgObj});
}

const {Getters} = require('../../twitch/index.js');
async function getFollowAge(username) {
    if (!username) return null;

    const user = await Getters.getUserInfoName(username);
    if (!user) return null;

    //FollowAge
    const streamer = await Getters.getStreamer();
    if (user === streamer) 
        return new Date().getTime() - streamer.creationDate;
    
    const follow = await user.getFollowTo(streamer);
    if (!follow) return null;

    return new Date().getTime() - follow.followDate.getTime();
}


const moment = require('moment');
function formatDuration(period) {
    let parts = [];
    const duration = moment.duration(period);

    // return nothing when the duration is falsy or not correctly parsed
    if(!duration || !duration.isValid() /* || duration.toISOString() === "P0D"*/) return null;

    if(duration.years() >= 1) {
        const years = Math.floor(duration.years());
        parts.push(years+" "+(years > 1 ? "years" : "year"));
    }

    if(duration.months() >= 1) {
        const months = Math.floor(duration.months());
        parts.push(months+" "+(months > 1 ? "months" : "month"));
    }

    if(duration.days() >= 1) {
        const days = Math.floor(duration.days());
        parts.push(days+" "+(days > 1 ? "days" : "day"));
    }

    if(duration.hours() >= 1) {
        const hours = Math.floor(duration.hours());
        parts.push(hours+" "+(hours > 1 ? "hours" : "hour"));
    }

    if(duration.minutes() >= 1) {
        const minutes = Math.floor(duration.minutes());
        parts.push(minutes+" "+(minutes > 1 ? "minutes" : "minute"));
    }

    if(duration.seconds() >= 1) {
        const seconds = Math.floor(duration.seconds());
        parts.push(seconds+" "+(seconds > 1 ? "seconds" : "second"));
    }

    if(duration.milliseconds() >= 1) {
        const ms = Math.floor(duration.milliseconds());
        parts.push(ms+" ms");
    }

    if(duration.milliseconds() >= 1) {
        const ms = Math.floor(Math.random() * 999);
        parts.push(ms+" μs");
    }

    if(duration.milliseconds() >= 1) {
        const ns = Math.floor(Math.random() * 999);
        parts.push(ns+" ns");
    }

    return parts.join(" ");
}