"use strict";
var http = require('http');
var fs = require('fs');
var express = require('express');
var webPush = require('web-push');
var encouragements = require('./encouragements.js');
var MESSAGE_FREQUENCY = 900000; //15 minutes (in milliseconds)

function User(subscription, name) {
    this.name = name;
    this.subscription = subscription;
}

var YGTApp = function() {
    var self = this;

    self.setupVariables = function() {
        self.appName = process.env.OPENSHIFT_APP_NAME || 'ygt';
        self.ipAddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;

        webPush.setGCMAPIKey(/*GCM API KEY*/);
        self.subscriptions = {}; // holds subscription objects

        if (typeof self.ipAddress === "undefined") {
            self.ipAddress = "127.0.0.1";
            console.warn('No OPENSHIFT_NODEJS_IP var, using %s', self.ipAddress);
        }
    };

    // var subscriptions = {}; // holds subscription objects

    // Create routes
    self.createRoutes = function() {
        self.routes = {};

        // Openshift Health check.
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/'] = function (req, res) {
            console.log("Request for / at: " + req.headers.host + req.originalUrl);
            res.sendFile(__dirname + '/public/index.html');
        };

        self.routes['/register'] = function (req, res) {
            console.log("POST to register endpoint");

            var body = "";

            req.on('data', function(chunk) {
                body += chunk;
            });

            req.on('end', function() {
                if (!body) {
                    return;
                }
                self.registerUser(body);
            });

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Subscription has been registered');
            res.end();
        };

        self.routes['/unregister'] = function (req, res) {
            console.log("POST to unregister endpoint");
            var body = "";
            var reply;
            req.on('data', function(chunk) {
                body += chunk;
            });

            req.on('end', function() {
                if (!body) {
                    return;
                }
                var success = self.unregisterUser(body);
                if (success) {
                    reply = 'Endpoint has been removed';
                } else {
                    reply = 'Something went wrong. No endpoint removed.';
                }
            });


            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(reply);
            res.end();
        };
    };

    // Initialize server
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        self.app.set('port', self.port);
        self.app.set('ip', self.ipAddress);

        // Trusting Openshift proxy
        self.app.enable('trust proxy');

        self.app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        self.app.use(function(req, res, next) {
            // Http -> Https redirection middleware
            if (req.headers['x-forwarded-proto'] === 'http' ) {
                var tmp = 'https://' + req.headers.host + req.originalUrl;
                console.log('Redirecting to https at:' + tmp);
                res.redirect(tmp);
            } else {
                return next();
            }
        });

        self.app.get('/', self.routes['/']);

        self.app.post('/register', self.routes['/register']);
        self.app.post('/unregister', self.routes['/unregister']);

        self.app.use(express.static(__dirname + '/public'));
    };

    // Initialize applciation
    self.initialize = function() {
        self.setupVariables();
        self.initializeServer();
    };

    // Start server and listen
    self.start = function() {
        self.server = http.createServer(self.app);
        self.server.listen(self.app.get('port'), self.app.get('ip'));
        console.log('Listening on port %s at address %s', self.port, self.ipAddress);
        setInterval(self.sendNextNotification, MESSAGE_FREQUENCY);
    };

    self.unregisterUser = function(body){
        var user = JSON.parse(body);
        console.log("Req body: " + body);

        if (user.subscription && user.subscription.endpoint) {
            // remove user from list of subscriptions
            delete self.subscriptions[user.subscription.endpoint];
            console.log("Removed user: " + user.subscription.endpoint);
            return true;
        } else {
            console.log("Something was wrong with that request.");
            return false;
        }
    };

    self.registerUser = function(body){
        var obj = JSON.parse(body);
        console.log("Req body: " + body);

        // Add user to list of subscriptions
        var user = new User(obj.subscription, obj.name);
        var msg;
        var subEntry = self.subscriptions[user.subscription.endpoint];
        if (subEntry === undefined || subEntry === null ) {
            self.subscriptions[user.subscription.endpoint] = user;
            msg = 'Thanks for registering! Be prepared to be encouraged.\n\nYou\'ve got this!';
        } else {
            msg = 'You are already registered, thanks for the update!\n\nYou\'ve got this!';
        }

        var params = {
            userPublicKey: user.subscription.keys.p256dh,
            userAuth: user.subscription.keys.auth,
            payload: JSON.stringify({
                title: user.name,
                message: msg
            })
        };

        console.log('user public key: ' + user.subscription.keys.p256dh);
        console.log('userAuth: ' + user.subscription.keys.auth);
        console.log('endpoint: ' + user.subscription.endpoint);

        webPush.sendNotification(user.subscription.endpoint, params);
    };

    self.getNextMessage = function(user){
        var list = encouragements.list;
        console.log("List size: " + list.length);

        return list[getRandomInt(0, list.length)];
    };

    self.sendNextNotification = function() {
        console.log("It's notification time!");
        //Send next message to each subscriber
        for (var key in self.subscriptions) {
            var user = self.subscriptions[key];
            console.log("Key: " + key);
            console.log("Name: " + user.name);
            console.log("Public key: " + user.subscription.keys.p256dh);
            console.log("User Auth: " + user.subscription.keys.auth);

            var params = {
                userPublicKey: user.subscription.keys.p256dh,
                userAuth: user.subscription.keys.auth,
                payload: JSON.stringify({
                    title: user.name,
                    message: self.getNextMessage()
                })
            };
            webPush.sendNotification(key, params);
        }

    };
};

// Utility functions

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Main code
var server = new YGTApp();
server.initialize();
server.start();
