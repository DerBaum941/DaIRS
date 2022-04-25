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
    rowNum INTEGER PRIMARY KEY NOT NULL,
    userID INTEGER NOT NULL,
    streakCount INTEGER NOT NULL,
    achievedAt TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS save_redeem_records BEFORE UPDATE
    ON twitch_redeem_streak
    WHEN NEW.streakCount = 0
    BEGIN
        INSERT INTO twitch_redeem_records(userID, streakCount, achievedAt)
            VALUES(OLD.userID, OLD.streakCount, date('NOW'));
    END;

CREATE TABLE IF NOT EXISTS twitch_redeem_stats (
    rewardID TEXT PRIMARY KEY NOT NULL,
    redeemCount INTEGER NOT NULL DEFAULT 0,
    totalPoints INTEGER NOT NULL DEFAULT 0
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
        VALUES(OLD.commandName, IIF(OLD.content,OLD.content,''), OLD.countUsed, date('NOW'));
END;