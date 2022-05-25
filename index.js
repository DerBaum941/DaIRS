//Load config file
const conf = require('./conf/general.json');

//Initialize Main Program
const main = require('./src/common/index');
main.Init(conf);

/** TODO
 * Total Tax command (per user and sum total) ->Done
 * Redeem stat tracker (Name into DB, but update every time) ->Done
 * Re-register discord commands regularly ->Done
 * API endpoint for redeem tracker ->Done
 * 
 * Move strings to config file
 * Add shoutout command | (@user) regex in config file
 * Add some more regular logging 
 * Build the twitter Integration fully ->Optional
 * 
 * Add new endpoint for aggregate redeem_records by uid
 * Add raffle feature, ?raffle start|end|join
 * Add point raffle feature, by name =="raffle" ?pointraffle
 * 
 * Fix DM Commands crashing it
 * 
 * Timeout on twitch crashes it
 * 
 * Cache twitch usernames better
 * 
 * Set Page size to 20
 * 
 * Add aliases the command list website thing
 * 
 * Track first redeems, with streak count cuz why not :)
 * 
 * Move link stat event into the request instead of whisper
 * 
 * Give Whisper requests a cooldown (in config file)
 * Fetch banned users (moderation:read) and disallow them from requesting links
 */