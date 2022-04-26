# API V1 Routes Info

## Type Reference

Read up on all Types used in responses

### Profile Object

    json: {
        userID, *String: Twitch Unique ID of the User*
        name, *String: Display Name of the User*
        avatar, *URL: Ref to the Profile Picture Image*
        isFollow, *Bool: Whether they follow the streamer*
        followAge, *String?: How long they followed, null if not following*
        lastSeen, *String: ISO Date String of last time seen*
        streakCount, *String: Their current redeem streak*
        streakActive, *String: When their streak ended, or Still active*
        msgSent, *Number: How many messages the User sent*
        pointsSpent, *Number: How many Points the User spent*
        redeemsGot, *Number: How many Redeems they received*
        linksRequested *Number: How many Links they requested*
    }

### Command Object

    json: {
        name, *String: The name of the command*
        used, *Number: How often it was used*
        value, *String?: The reply attached to the command, or null*
        description, *String: Description of the command*
        enabled *Number: 0 representing disabled, 1 for enabled*
    }

### Trigger Object

    json: {
        name, *String: Trigger message*
        value, *String: Reply to send*
        used *Number: How often it was triggered*
    }

### Leaderboard Row Object

    json: {
        name, *String: Twitch Name of the User*
        value *Number: The score they achieved*
    }

### Streaks Row Object

    json: {
        name, *String: Twitch Name of the User*
        value, *Number: The score they achieved*
        active? *String: When the streak ended or whether it's Still active*
    }

## **GET Routes**

### Stats Endpoints

All of the following stats endpoints may be trailed with a limit of rows to fetch e.g. [...]**/50**  
Defaults to 20 Rows;

#### **List Route: Streak Stats /api/v1/stats/streak/**
Gives a Leaderboard of the longest Streaks (ALL TIME)  
For past streaks, "active" will display the last Day of the Streak, in ISO Format  
For ongoing streaks, "active" will say "Still active"  
@returns: \[StreaksRow]

#### **List Route: Command Stats /api/v1/stats/commands/**

Retrieves a sorted array of the most used Commands  
@returns: \[Command]

#### **List Route: Trigger Stats /api/v1/stats/triggers/**

Retrieves a sorted array of the most ran Triggers  
@returns: \[Trigger]

#### **List Route: Redeems Stats /api/v1/stats/redeems/**

Gives a leaderboard of who received the most redeems  
@returns: \[LeaderboardRow]

#### **List Route: Point Stats /api/v1/stats/points/**

Gives a leaderboard of who spent the most redeem Points  
@returns: \[LeaderboardRow]

#### **List Route: Message Stats /api/v1/stats/message/**

Gives a leaderboard of who sent the most messages in chat  
@returns: \[LeaderboardRow]

#### **List Route: Link Stats /api/v1/stats/links/**

Gives a leaderboard of who requested the most links  
@returns: \[LeaderboardRow]

---

### Commands Endpoints

#### **List Route: /api/v1/commands/**

Requesting this Endpoint will respond with a List of all commands  
@returns: \[Command]

#### **Query Route: /api/v1/commands/:commandName**

Where :commandName is substituted with part of the name of the command(s) to search for.  
@returns: \[Command]

#### **Query Route:  /api/v1/commands/reply/:searchText**

Searches through commands, retrieves all command(s) that contain :searchText in their reply  
@returns: \[Command]

---

### User Endpoints

#### **Query Route: /api/v1/commands/reply/:username**

Retrieves Profile for a Twitch User, by login name.
Returns Status 400 if User was invalid.
@returns: \[Profile]

---

## **Other Methods are not (yet) supported**