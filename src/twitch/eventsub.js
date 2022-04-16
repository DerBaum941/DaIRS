const express        = require('express');
const app = express();
const cors = require('cors');

var session        = require('express-session');
var passport       = require('passport');
const { EventSubListener, EventSubMiddleware } = require('@twurple/eventsub');

app.use(cors())
app.use(express.json({limit: '25MB'}))
app.use('/dairs/callback', callback())


// .. "/dairs"
//https://sdasdas.coom/dairs/hooks/abc -> localhost:3000

async function callback(req, res) {
  // bla bla
}

function init(apiClient) {
    const listener = new EventSubListener({
        apiClient,
        adapter: new ReverseProxyAdapter({ //creates an http server with ssl
            hostName: 'ottr.space/ttvd', // The host name the server is available from
            port: 8080, // Port, self explanatoiry
            pathPrefix: '/dairs' //
        }),
        secret: 'thisShouldBeARandomlyGeneratedFixedString'
    });
    
    await listener.listen();
    listener.subscribeToChannelFollowEvents() //PUT EventSub 



    listener.subscribeToChannelSubscriptionEndEvents() //Webhook -> /ttvd -> localhost:8080
}