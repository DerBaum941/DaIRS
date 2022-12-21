const db = require('better-sqlite3')('./src/db/sqlite.db');
const { Getters } = require('../../twitch/index.js');
const streaks = require("../redeem_streak.js");

exports.data = {
    //Default: true
    enabled: true,                     //! Gets overwritten by Database config ! Whether the command should be enabled

    //Default: false
    modOnly: true,                     //Make only usable by Twitch Mods & Discord "Manage message" permission

    //Default: true
    twitchEnabled: true,               //Whether it should be usable on Twitch

    //Default: true
    //Disabled because I cannot be bothered right now!
    discordEnabled: false,              //Whether it should be usable on Discord

    //Required. Must be globally unique
    commandName: 'streakadmin',            //Name that it is invoked by (e.g. !example)

    //Optional. Must be globally unique
    aliases: ['sa', 'taxadmin', 'ta'],            //Aliases the command is available as

    //Default: None
    twitchChoices: ['restore', 'set', 'newstream'], //Only provided choices are accepted as the second argument

    //Default: None
    discordOptions: [],                //Must resolve to Discord Options: https://discord.js.org/#/docs/discord.js/stable/typedef/ApplicationCommandOptionData

    description:                       //Text used for documenting
        'Use this to fix things with taxes'
};

//NOTE: Callback functions may throw "rejected"; in this case, no reply will be sent

/**
 * Function that gets executed FIRST when command is invoked
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {string} args String remainder of the original message, excluding commandName
 * @return {void}
 */
exports.callback = async (Emitter, Clients, args) => {

}

/**
 * Discord slash command specific callback values
 * @param {EventEmitter} Emitter The app's Event Emitter, add callbacks to other things if you want.
 * @param {Clients} Clients {discord: bot, twitch: {chat,api,pubsub,eventsub}}
 * @param {Object} interaction Interaction of the Discord slash command
 * @return {void}
 */
exports.discordCallback = async (Emitter, Clients, interaction) => {

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
    switch (choice) {
        case restore:
            restoreStreaks();
            Clients.twitch.chat.say(ch, "Successfully restored all streak counts from last stream!", { replyTo: msgObj });
            break;
        case set:
            if (!args)
            {
                Clients.twitch.chat.say(ch, "Try something like !ta set @DaIRS_ 42", { replyTo: msgObj });
                return;
            }

            const argRe = /^@?(?<usr>\w+).*?(?<num>[0-9]+)/gi
            const argResult = argRe.exec(args);

            //Invalid args
            if (!argResult.groups) {
                Clients.twitch.chat.say(ch, "Couldn't find that user!", { replyTo: msgObj });
                return;
            }
            const helixUser = await Getters.getUserInfoName(argResult.groups.usr);

            setStreak(helixUser, argResult.groups.num);

            Clients.twitch.chat.say(ch, `Successfully set ${helixUser.displayName}'s streak to a count of ${argResult.groups.num}`, { replyTo: msgObj });
            break;
        case newstream:
            triggerNewStream();
            Clients.twitch.chat.say(ch, "Now everyone has to pay again!", { replyTo: msgObj });
            break;
    }

}

function restoreStreaks()
{
    //First find the Date of the last mass reset / aka the broken stream
    var date = db.prepare("SELECT achievedAt FROM twitch_redeem_records ORDER BY achievedAt LIMIT 1").pluck().get(); //Formatted as YYYY-mm-DD string btw

    if (date == undefined)
    {
        return;
    }
    //Now go through each record of that date
    //And throw its values in the original table
    const stmt = db.prepare("SELECT userID, streakCount FROM twitch_redeem_records WHERE achievedAt = ?");
    const update = db.prepare("UPDATE twitch_redeem_streak SET streakActive = 1, streakCount = ? WHERE userID = ?");
    for (const row of stmt.iterate(date))
    {
        update.run(row.streakCount, row.userID);
    }
}

function setStreak(target, count)
{
    streaks.onRedeem(target.id);

    db.prepare("UPDATE twitch_redeem_streak SET streakCount = ?, streakActive = 1 WHERE userID = ?").run(count,userID);
}

function triggerNewStream()
{
    streaks.onStreamEnd();
    setTimeout(streaks.onStreamStart,250);
}