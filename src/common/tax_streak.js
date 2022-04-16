var instances;

async function init(callbacks) {
    instances = callbacks;

    instances.Emitter.on('TwitchStreamStart',(channel)=>{
        if (channel != "daddy") return;
    });
}


async function getStreakActive(user) {
	var row = await instances.DB.find("taxes", userID, user);
	if (row.streakActive === 1)
		return true;
	else return false;
}

async function getStreakCount(user) {
    const count = await instances.db.find("taxes", userID, user);
	return count.streakCount;
}


async function onStreamStart() {
    await instances.DB.each("UPDATE SET `streakActive`=0");
}

async function onStreamEnd() {
    await instances.DB.each("UPDATE SET `streakCount`=IIF(`streakActive`=0, `streakCount`,0)");
}

async function onTaxing(userId) {
    //create if not exists
    //increment if exists
    //also set active
	var row = instances.DB.find("taxes", "userID", userId);
    row.streakActive = 1;
    row.streakCount++;
	instances.DB.upsert(row);    
}


/*
    MOD COMMANDS? MAYBE?
    FUck Mods
*/

// Usage: resetStreak([User ID of the target])
async function resetStreak(userId) {
	var row = await instances.DB.find("taxes", "userID", userId);
	row.streakCount = 0;
	instances.DB.upsert(row);
}

// Usage: incrementStreak([User ID of the target], [int number to set streak])
async function setStreak(userId, streak) {
	//var row = await instances.DB.find("taxes", userID, user
    await instances.DB.getQuery(`UPDATE SET \`streakCount\`=${streak} WHERE \`userID\`=${userId}`);
	//row.streakCount = row.streakCount + 1
	//instances.DB.upsert(row)
}