PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS twitch_auth_tokens (
    userID INTEGER PRIMARY KEY NOT NULL,
    accessToken TEXT NOT NULL,
    refreshToken TEXT NOT NULL,
    expiresIn INTEGER DEFAULT 0,
    obtainmentTimestamp INTEGER DEFAULT 0,
    scope TEXT
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS twitch_redeem_streak (
    userID INTEGER PRIMARY KEY NOT NULL,
    streakCount INTEGER NOT NULL DEFAULT 1,
    streakActive INTEGER NOT NULL DEFAULT 1
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS twitch_redeem_records (
    rowNum INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    userID INTEGER NOT NULL,
    streakCount INTEGER NOT NULL,
    achievedAt TEXT NOT NULL
);
DROP TRIGGER IF EXISTS save_redeem_records_stats;
CREATE TRIGGER IF NOT EXISTS save_redeem_records_stats
    AFTER UPDATE ON twitch_redeem_streak
    WHEN NEW.streakCount = 0 AND OLD.streakCount > 0
    BEGIN
        INSERT INTO twitch_redeem_records(userID, streakCount, achievedAt)
            VALUES(OLD.userID, OLD.streakCount, date('now'));
    END;

CREATE TABLE IF NOT EXISTS twitch_redeem_stats (
    rewardID TEXT PRIMARY KEY NOT NULL,
    rewardName TEXT NOT NULL,
    redeemCount INTEGER NOT NULL DEFAULT 0,
    totalPoints INTEGER NOT NULL DEFAULT 0,
    lastUsed TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS chat_commands (
    commandID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    commandName TEXT NOT NULL UNIQUE COLLATE NOCASE,
    countUsed INTEGER NOT NULL DEFAULT 0,
    options TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    modOnly INTEGER NOT NULL DEFAULT 0,
    domain TEXT NOT NULL,
    content TEXT DEFAULT NULL,
    replyDM INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT NULL,
    builtFromFile INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS commandIdx ON chat_commands(commandName);
CREATE INDEX IF NOT EXISTS contentIdx ON chat_commands(content);

CREATE TABLE IF NOT EXISTS command_alias (
    aliasID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    commandID INTEGER NOT NULL ,
    aliasName TEXT NOT NULL UNIQUE COLLATE NOCASE,
    FOREIGN KEY(commandID) REFERENCES chat_commands(commandID) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS aliasIdx ON command_alias(aliasName);
CREATE INDEX IF NOT EXISTS commIDx ON command_alias(commandID);

CREATE TABLE IF NOT EXISTS old_command_stats (
    rowNum INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    commandName TEXT NOT NULL,
    content TEXT NOT NULL,
    countUsed INTEGER NOT NULL,
    deletedOn TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS save_command_stats AFTER DELETE ON chat_commands 
BEGIN
    INSERT INTO old_command_stats(commandName, content, countUsed, deletedOn)
        VALUES(OLD.commandName, IIF(OLD.content,OLD.content,''), OLD.countUsed, date('now'));
END;

CREATE TABLE IF NOT EXISTS twitch_chat_triggers (
    triggerName TEXT NOT NULL PRIMARY KEY COLLATE NOCASE,
    reply TEXT NOT NULL,
    countUsed INTEGER DEFAULT 0 NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS old_chat_triggers (
    triggerID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    triggerName TEXT NOT NULL,
    reply TEXT NOT NULL,
    countUsed INTEGER NOT NULL,
    deletedOn TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS save_chat_trigger_stats AFTER DELETE ON twitch_chat_triggers 
BEGIN
    INSERT INTO old_chat_triggers(triggerName, reply, countUsed, deletedOn)
        VALUES(OLD.triggerName, OLD.reply, OLD.countUsed, date('now'));
END;

CREATE TABLE IF NOT EXISTS stats_messages_sent (
    userID INTEGER PRIMARY KEY NOT NULL,
    numMessages INTEGER NOT NULL DEFAULT 1,
    lastSeen timestamp NOT NULL DEFAULT (strftime('%s', 'now'))
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS stats_redeems_got (
    userID INTEGER PRIMARY KEY NOT NULL,
    sumTotal INTEGER NOT NULL DEFAULT 0,
    numRedeems INTEGER NOT NULL DEFAULT 1,
    lastSeen timestamp NOT NULL DEFAULT (strftime('%s', 'now'))
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS stats_whispers_sent (
    userID INTEGER PRIMARY KEY NOT NULL,
    numMessages INTEGER NOT NULL DEFAULT 1,
    lastSeen timestamp NOT NULL DEFAULT (strftime('%s', 'now'))
) WITHOUT ROWID;
