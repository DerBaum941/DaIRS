exports.data = {
    commandName: 'toggle',
    enabled: true,
    twitchEnabled: true,
    discordEnabled: false,
    aliases: ['tog'],
    modOnly: true,
    description: "Toggle response messages",
    twitchChoices: ['streak', 'links'],
    discordOptions: []
}

exports.twitchCallback = async (Emitter, Clients, channel, user, choice, args, msgObj) => {
    switch (choice) {
        case 'streak':
            if (!streakToggle(Emitter, Clients, channel, args, msgObj)) throw "rejected";
            return;
        case 'links':
            if (!linkToggle(Emitter, Clients, channel, args, msgObj)) throw "rejected";
            return;
        default:
            throw "rejected";
    }

}

function streakToggle(Emitter, Clients, channel, args, msgObj) {
    var toggle = null;
    switch (args) {
        case 'on':
            toggle = true;
            Emitter.emit('StreakToggle', toggle);
            break;
        case 'off':
            toggle = false;
            Emitter.emit('StreakToggle', toggle);
            break;
        default:
            return false;
    }
    if (toggle) {
        Clients.twitch.chat.say(channel, `Successfully enabled streak replies`, {replyTo: msgObj});
    } else {
        Clients.twitch.chat.say(channel, `Successfully disabled streak replies`, {replyTo: msgObj});
    }
    return true;
}

function linkToggle(Emitter, Clients, channel, args, msgObj) {
    var toggle = null;
    switch (args) {
        case 'on':
            toggle = true;
            Emitter.emit('LinkToggle', toggle);
            break;
        case 'off':
            toggle = false;
            Emitter.emit('LinkToggle', toggle);
            break;
        default:
            return false;
    }
    if (toggle) {
        Clients.twitch.chat.say(channel, `Successfully enabled link requests`, {replyTo: msgObj});
    } else {
        Clients.twitch.chat.say(channel, `Successfully disabled link requests`, {replyTo: msgObj});
    }
    return true;
}