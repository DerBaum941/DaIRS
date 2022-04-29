import { Router } from 'express';
import session from 'express-session';
import passport from 'passport';
import { OAuth2Strategy } from 'passport-oauth';
import https from 'https';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs';

//Subroutes
//import routesV1 from './v1/index.mjs';
const router = Router();

//Config
var TWITCH_CLIENT_ID;
var TWITCH_SECRET;
const SESSION_SECRET = randomBytes(64).toString('hex');
const CALLBACK_URL = 'https://dairs.derbaum.rocks/mod/auth/twitch/callback';
const LOGIN_SCOPE = ['chat:read'];

{
    const authpath = path.resolve('./conf/credentials.json');
    const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).twitch;
    TWITCH_CLIENT_ID = auth.clientID;
    TWITCH_SECRET = auth.clientSecret;
}

//Middlewares
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

    done(null, profile);
  }
));
//Login route to start auth, if they don't have a session
router.use('/login', passport.authenticate('twitch', {scope: LOGIN_SCOPE}));

// Set route for OAuth redirect
router.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/' }));

// If user has an authenticated session, pass along, otherwise redirect to login
router.use((req, res, next) => {
    if(req.session && req.session.passport && req.session.passport.user) {
      const data = req.session.passport.user.data[0];
      next();
    } else {
      res.redirect('/mod/login');
    }
  });

router.get('/', (req, res) => {
    res.sendFile('/index.html');
})
//Subroutes
//router.use('/v1/user', routesV1.user);
//router.use('/v1/stats', routesV1.stats);
//router.use('/v1/commands', routesV1.commands);

export default router;