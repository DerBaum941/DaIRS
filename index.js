//Load config file
const conf = require('./conf/general.json');

//Initialize Main Program
const main = require('./src/common/index');
main.Init(conf);

/** TODO
 * Move strings to config file
 * Add shoutout command | (@user) regex in config file
 * Add some more regular logging 
 * Health checks??
 * Re-register discord commands regularly ->Done
 * Build the twitter Integration fully
 * Total Tax command (per user and sum total) ->Done
 * Redeem stat tracker (Name into DB, but update every time) ->Done
 * API endpoint for redeem tracker ->Done
 */