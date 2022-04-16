CREATE TABLE IF NOT EXISTS twitch_auth_tokens (
    userID INTEGER PRIMARY KEY NOT NULL,
    accessToken TEXT NOT NULL,
    refreshToken TEXT NOT NULL,
    expiresIn INTEGER DEFAULT 0,
    obtainmentTimestamp INTEGER DEFAULT 0,
    scope TEXT
);

CREATE TABLE IF NOT EXISTS twitch_redeem_streak (
    userID INTEGER PRIMARY KEY NOT NULL,
    streakCount INTEGER NOT NULL DEFAULT 0,
    streakActive INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS twitch_custom_commands (
    commandID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    commandName TEXT NOT NULL,
    content TEXT NOT NULL,
    countUsed INTEGER NOT NULL
);