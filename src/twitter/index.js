const twitter = require('twitter-api-v2');
const path = require('path');
const fs = require('fs');
const c = require('./../common/logman.js')

// Instanciate with desired auth type (here's Bearer v2 auth)
const authpath = path.normalize(__dirname + './../../conf/credentials.json');
const auth = JSON.parse(fs.readFileSync(authpath, 'utf8')).twitter.token;
const twitterClient = new twitter.TwitterApi(auth).readOnly;
delete auth, authpath;

var instances;
var monitoredAccountIds = [];
var monitoredAccounts = [];


async function init(conf, callbacks) {
    instances = callbacks;

    monitoredAccounts = conf.accounts;

    await createV2Stream();

    return new Promise(res=>setTimeout(res,1000));
}

exports.init = init;

async function createV2Stream() {

    //from: monitoredAccountIds
    const stream = await twitterClient.v2.searchStream(
        {
        'tweet.fields': ['author_id', 'text', 'attachments', 'entities', 'created_at'],
        'media.fields': ['preview_image_url','url'],
        expansions: ['author_id','attachments.media_keys']
        },
        {autoConnect: false});

    // Get and delete old rules if needed
    const rules = await twitterClient.v2.streamRules();
    if (rules.data?.length) {
        await twitterClient.v2.updateStreamRules({
            delete: { ids: rules.data.map(rule => rule.id) }
        });
    }

    monitoredAccounts.forEach(async (name)=> {
        await twitterClient.v2.updateStreamRules({
            add: [{ value: 'from:'+name, 
                    tag: 'Monitored Account '+name }]
          });
    });



    // Emitted on Tweet
    stream.on(twitter.ETwitterStreamEvent.Data, c.debug);

    // Emitted only on initial connection success
    stream.on(twitter.ETwitterStreamEvent.Connected, () => c.inf('Monitoring Tweets'));
    
    await stream.connect({ autoReconnect: true, autoReconnectRetries: Infinity });

    return new Promise(res => setTimeout(res,1000));
}

/*  Because this crap isn't documented for shit

UserV2 {
  id: string;
  name: string;
  username: string;
  created_at?: string; // ISO 8601 date
  protected?: boolean;
  withheld?: {
    country_codes?: string[];
    scope?: 'user';
  }
  location?: string;
  url?: string;
  description?: string;
  verified?: boolean;
  entities?: {
    url?: { urls: UrlEntity[] };
    description: {
      urls?: UrlEntity[];
      hashtags?: HashtagEntity[];
      cashtags?: CashtagEntity[];
      mentions?: MentionEntity[];
    }
  }
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  },
  pinned_tweet_id?: string;
}

=================================================================================================================

export type TTweetv2Expansion = 'attachments.poll_ids' | 'attachments.media_keys'
  | 'author_id' | 'referenced_tweets.id' | 'in_reply_to_user_id'
  | 'geo.place_id' | 'entities.mentions.username' | 'referenced_tweets.id.author_id';

export type TTweetv2MediaField = 'duration_ms' | 'height' | 'media_key' | 'preview_image_url' | 'type'
  | 'url' | 'width' | 'public_metrics' | 'non_public_metrics' | 'organic_metrics' | 'alt_text';

export type TTweetv2PlaceField = 'contained_within' | 'country' | 'country_code' | 'full_name' | 'geo' | 'id' | 'name' | 'place_type';

export type TTweetv2PollField = 'duration_minutes' | 'end_datetime' | 'id' | 'options' | 'voting_status';

export type TTweetv2TweetField = 'attachments' | 'author_id' | 'context_annotations' | 'conversation_id'
  | 'created_at' | 'entities' | 'geo' | 'id' | 'in_reply_to_user_id' | 'lang'
  | 'public_metrics' | 'non_public_metrics' | 'promoted_metrics' | 'organic_metrics'
  | 'possibly_sensitive' | 'referenced_tweets' | 'reply_settings' | 'source' | 'text' | 'withheld';

export type TTweetv2UserField = 'created_at' | 'description' | 'entities' | 'id' | 'location'
  | 'name' | 'pinned_tweet_id' | 'profile_image_url' | 'protected' | 'public_metrics'
  | 'url' | 'username' | 'verified' | 'withheld';

export interface Tweetv2FieldsParams {
  expansions: TypeOrArrayOf<TTweetv2Expansion> | string;
  'media.fields': TypeOrArrayOf<TTweetv2MediaField> | string;
  'place.fields': TypeOrArrayOf<TTweetv2PlaceField> | string;
  'poll.fields': TypeOrArrayOf<TTweetv2PollField> | string;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField> | string;
  'user.fields': TypeOrArrayOf<TTweetv2UserField> | string;
}

*/