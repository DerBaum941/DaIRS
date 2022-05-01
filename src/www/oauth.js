/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

*/
// Define our dependencies
const passport     = require('passport');
var session        = require('express-session');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const https        = require('https');
var handlebars     = require('handlebars');
var { randomBytes }= require('crypto');
var path           = require('path');
var fs             = require('fs');
var c              = require('../common/logman.js');
var instances;
const { Router } = require('express');


// Define our constants, you will change these with your own
var TWITCH_CLIENT_ID;
var TWITCH_SECRET;
const SESSION_SECRET   =  randomBytes(64).toString('hex');
const DEFAULT_SCOPE    = ['chat:read',"channel:read:redemptions"]; //'channel:read:subscriptions', 'bits:read'
const BOT_SCOPE        = ['chat:read','chat:edit','channel:moderate','whispers:read','whispers:edit', 'channel:read:redemptions', 
    'channel:read:predictions', 'channel:read:subscriptions', 'channel:read:predictions', 'channel:read:polls', 'channel:read:hype_train'];
const ACTIVE_SCOPE     = BOT_SCOPE;
const USER_SCOPE       = DEFAULT_SCOPE;


const router = Router();

async function init (cnf, callbackero) {
  instances = callbackero;

  const CALLBACK_URL = cnf.oauth_uri;

  
{
  const authpath = path.normalize(__dirname+'./../../conf/credentials.json');
  const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).twitch;
  TWITCH_CLIENT_ID = auth.clientID;
  TWITCH_SECRET = auth.clientSecret;
}


router.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));

router.use(passport.initialize());
router.use(passport.session());


// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = (accessToken, done) => {

const httpsOptions = {
  hostname: 'api.twitch.tv',
  path: '/helix/users',
  port: 443,
  headers: {
    'Client-ID': TWITCH_CLIENT_ID,
    'Accept': 'application/vnd.twitchtv.v5+json',
    'Authorization': 'Bearer ' + accessToken
  }
};
https.get(httpsOptions, res => {
  if (res?.statusCode != 200) done(null, null);
  res.on(('data'), (body) => {
    const data = JSON.parse(body);
    c.debug("Got User Profile Info:")
    c.debug(data);
    done(null, data);
  });
});
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use('twitch', new OAuth2Strategy({
  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
  tokenURL: 'https://id.twitch.tv/oauth2/token',
  clientID: TWITCH_CLIENT_ID,
  clientSecret: TWITCH_SECRET,
  callbackURL: CALLBACK_URL,
  state: true
},
(accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;
  c.debug("Got Token for UID: "+profile.data[0].id);
  profile.data[0].accessToken = accessToken;
  profile.data[0].refreshToken = refreshToken;

  done(null, profile);
}
));

// Set route to start OAuth link, this is where you define scopes to request
router.get('/twitch', passport.authenticate('twitch', {scope: ACTIVE_SCOPE}));
router.get('/twitch/bot', passport.authenticate('twitch', {scope: BOT_SCOPE}));
router.get('/twitch/user', passport.authenticate('twitch', {scope: USER_SCOPE}));

// Set route for OAuth redirect
router.get('/twitch/callback', passport.authenticate('twitch', { successRedirect: '/auth/twitch/success', failureRedirect: '/stats' }));

// Define a simple template to safely generate HTML with values from user's profile
var template = handlebars.compile(`
<html><head><title>Twitch Auth</title></head>
<table>
  <tr><th>User ID</th><td>{{id}}</td></tr>
  <tr><th>Display Name</th><td>{{display_name}}</td></tr>
  <tr><th>Bio</th><td>{{description}}</td></tr>
  <tr><th>Image</th><td><br><img src="{{profile_image_url}}"></td></tr>
</table></html>`);

// If user has an authenticated session, display it, otherwise display link to authenticate
router.get('/twitch/success', (req, res) => {
if(req.session && req.session.passport && req.session.passport.user) {
  const data = req.session.passport.user.data[0];
  
  instances.DB.upsert("twitch_auth_tokens", {
      "userID": data.id,
      "accessToken": data.accessToken,
      "refreshToken": data.refreshToken,
      "expiresIn": 0,
      "obtainmentTimestamp": 0,
      "scope": null
  });
  instances.Emitter.emit('NewTwitchAuth',data);
  res.send(template(data));
} else {
  res.redirect('/');
}
});

  return new Promise(res => setTimeout(res,100));
}
exports.init = init;
exports.router = router;
