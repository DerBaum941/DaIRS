/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

*/
// Define our dependencies
const express      = require('express');
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


/*  This link to generate a Token
*   http://localhost:3000/auth/twitch?scope=channel:moderate+chat:edit+chat:read
*/


// Define our constants, you will change these with your own
var TWITCH_CLIENT_ID;
var TWITCH_SECRET;
const SESSION_SECRET   =  randomBytes(64).toString('hex');
const CALLBACK_URL     = 'http://localhost:3000/auth/twitch/callback';  // You can run locally with - http://localhost:3000/auth/twitch/callback
const DEFAULT_SCOPE    = ['chat:read',"channel:read:redemptions"]; //'channel:read:subscriptions', 'bits:read'
const BOT_SCOPE        = ['chat:read','chat:edit','channel:moderate','whispers:read','whispers:edit', 'channel:read:redemptions', 
    'channel:read:predictions', 'channel:read:subscriptions', 'channel:read:predictions', 'channel:read:polls', 'channel:read:hype_train'];
//const MAX_SCOPE        = 'chat:read+chat:edit+bits:read+moderation:read+channel:manage:polls+channel:manage:predictions+channel:manage:redemptions+channel:read:hype_train'+
//                         '+channel:read:polls+channel:read:predictions+channel:read:redemptions'
const ACTIVE_SCOPE     = BOT_SCOPE;
const USER_SCOPE       = DEFAULT_SCOPE;

{
    const authpath = path.normalize(__dirname+'./../../conf/credentials.json');
    const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).twitch;
    TWITCH_CLIENT_ID = auth.clientID;
    TWITCH_SECRET = auth.clientSecret;
}

// Initialize Express and middlewares
var app = express();

 init = (callbackero) => {
    instances = callbackero;
    return new Promise(res => setTimeout(res,500));
}

app.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());


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
      done(null, JSON.parse(body));
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
    profile.data[0].accessToken = accessToken;
    profile.data[0].refreshToken = refreshToken;

    done(null, profile);
  }
));

// Set route to start OAuth link, this is where you define scopes to request
app.get('/auth/twitch', passport.authenticate('twitch', {scope: ACTIVE_SCOPE}));
app.get('/auth/twitch/bot', passport.authenticate('twitch', {scope: BOT_SCOPE}));
app.get('/auth/twitch/user', passport.authenticate('twitch', {scope: USER_SCOPE}));

// Set route for OAuth redirect
app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/auth/twitch/success', failureRedirect: '/' }));

// Define a simple template to safely generate HTML with values from user's profile
var template = handlebars.compile(`
<html><head><title>Twitch Auth</title></head>
<table>
    <tr><th>Access Token</th><td>{{accessToken}}</td></tr>
    <tr><th>Refresh Token</th><td>{{refreshToken}}</td></tr>
    <tr><th>Display Name</th><td>{{display_name}}</td></tr>
    <tr><th>Bio</th><td>{{description}}</td></tr>
    <tr><th>Image</th><td><br><img src="{{profile_image_url}}"></td></tr>
</table></html>`);

// If user has an authenticated session, display it, otherwise display link to authenticate
app.get('/auth/twitch/success', (req, res) => {
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

app.listen(3000, () => {
  c.inf('Twitch auth @ 3000!');
});

exports.init = init;