"use strict";
const http = require('http');
const fs = require('fs');
const app = require('express')();
const webPush = require('web-push');
const encouragements = require('./encouragements.js');

var subscriptions = {}; // holds subscription objects

var messageFrequency = 9000;// 900000; //15 minutes (in milliseconds)

var PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var HOST = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

function User(subscription, name) {
    this.name = name;
    this.subscription = subscription;
}

webPush.setGCMAPIKey(/*GCM API Key*/);

http.createServer(app).listen(PORT, HOST);
console.log('Server listening on %s:%s', HOST, PORT);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//routes
app.post('/register', function (req, res) {
    console.log("POST to register endpoint");

    var body = "";

    req.on('data', function(chunk) {
      body += chunk;
    });

    req.on('end', function() {
        if (!body) {
            return;
        }
        registerUser(body);
    });

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Subscription has been registered');
    res.end();
});

app.post('/unregister', function (req, res) {
    var body = "";

    req.on('data', function(chunk) {
      body += chunk;
    });

    req.on('end', function() {
        if (!body) {
            return;
        }
        unregisterUser(body);
    });

    console.log("POST to unregister endpoint");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Endpoint has been removed');
    res.end();
});

function unregisterUser(body){
    var user = JSON.parse(body);
    console.log("Req body: " + body);

    // remove user from list of subscriptions
    delete subscriptions[user.subscription.endpoint];
}

function registerUser(body){
    var obj = JSON.parse(body);
    console.log("Req body: " + body);

    // Add user to list of subscriptions
    var user = new User(obj.subscription, obj.name);
    subscriptions[user.subscription.endpoint] = user;

    var params = {
        userPublicKey: user.subscription.keys.p256dh,
        userAuth: user.subscription.keys.auth,
        payload: JSON.stringify({
            title: user.name,
            message: 'Thanks for registering! Be prepared to be encouraged.'
        })
    };

    console.log('user public key: ' + user.subscription.keys.p256dh);
    console.log('userAuth: ' + user.subscription.keys.auth);
    console.log('endpoint: ' + user.subscription.endpoint);

    webPush.sendNotification(user.subscription.endpoint, params);
}

function getNextMessage(user){
    var list = encouragements.list;
    console.log("List size: " + list.length);

    return list[getRandomInt(0, list.length)];
}

function sendNextNotification() {
    console.log("It's notification time!");
    //Send next message to each subscriber
    for (var key in subscriptions) {
        var user = subscriptions[key];
        console.log("Key: " + key);
        console.log("Name: " + user.name);
        console.log("Public key: " + user.subscription.keys.p256dh);
        console.log("User Auth: " + user.subscription.keys.auth);

        var params = {
            userPublicKey: user.subscription.keys.p256dh,
            userAuth: user.subscription.keys.auth,
            payload: JSON.stringify({
                title: user.name,
                message: getNextMessage()
            })
        };
        webPush.sendNotification(key, params);
    }

}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

setInterval(sendNextNotification, messageFrequency);
