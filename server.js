"use strict";
const http = require('http');
// const https = require('https');
const fs = require('fs');
const express = require('express');
const webPush = require('web-push');
const encouragements = require('./encouragements.js');
const MESSAGE_FREQUENCY = 9000;// 900000; //15 minutes (in milliseconds)

function User(subscription, name) {
    this.name = name;
    this.subscription = subscription;
}

var YGTApp = function() {
    var self = this;

    self.setupVariables = function() {
        self.appName = process.env.OPENSHIFT_APP_NAME || 'ygt';
        self.ipAddress = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
        self.port = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8084;
        self.subscriptions = {}; // holds subscription objects
    };

    if (typeof self.ipAddress === "undefined") {
        self.ipAddress = "127.0.0.1";
        console.warn('No OPENSHIFT_NODEJS_IP var, using %s', self.ipAddress);
    }


    // var subscriptions = {}; // holds subscription objects

    // Create routes
    self.createRoutes = function() {
        self.routes = {};

        // Openshift Health check.
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/'] = function (req, res) {
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

            req.on('data', function(chunk) {
                body += chunk;
            });

            req.on('end', function() {
                if (!body) {
                    return;
                }
                self.unregisterUser(body);
            });


            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Endpoint has been removed');
            res.end();
        };
    };

    // Initialize server
    self.initiializeServer = function() {
        self.createRoutes();
        self.app = express();

        webPush.setGCMAPIKey(/*GCM API Key*/);

        self.app.get('/', redirectSec, self.routes['/']);

        self.app.post('/register', redirectSec, self.routes['/register']);
        self.app.post('/unregister', redirectSec, self.routes['/unregister']);

        self.app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        self.app.use(express.static(__dirname + '/public'));
    };

    // Initialize applciation
    self.initialize = function() {
        self.setupVariables();
        self.initiializeServer();
    };

    // Start server and listen
    self.start = function() {
        self.server = http.createServer(self.app);
        self.server.listen(self.port, self.ipAddress);
        console.log('Listening on port %s at address %s', self.port, self.ipAddress);
        setInterval(self.sendNextNotification, MESSAGE_FREQUENCY);
    };

    self.unregisterUser = function(body){
        var user = JSON.parse(body);
        console.log("Req body: " + body);

        // remove user from list of subscriptions
        delete self.subscriptions[user.subscription.endpoint];
    };

    self.registerUser = function(body){
        var obj = JSON.parse(body);
        console.log("Req body: " + body);

        // Add user to list of subscriptions
        var user = new User(obj.subscription, obj.name);
        self.subscriptions[user.subscription.endpoint] = user;

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

// Redirects requests to HTTPS
function redirectSec(req, res, next) {
    if (req.headers['x-forwarded-proto'] === 'http') {
        console.log('Redirecting to https');
        res.redirect('https://' + req.headers.host + req.path);
    } else {
        return next();
    }
}

//http.createServer(app).listen(PORT, HOST);
//console.log('Server listening on %s:%s', HOST, PORT);

// // Run separate https server if on localhost
// if (process.env.NODE_ENV != 'production') {
//     https.createServer(app).listen(process.env.PORT, function () {
//         console.log("Express server listening with https on port %d in %s mode", this.address().port, app.settings.env);
//     });
// };
//
// if (process.env.NODE_ENV == 'production') {
//     app.use(function (req, res, next) {
//         res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
//         if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
//             return res.redirect(301, 'https://' + req.host + req.url);
//         } else {
//             return next();
//             }
//     });
// } else {
//     app.use(function (req, res, next) {
//         res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
//         if (!req.secure) {
//             return res.redirect(301, 'https://' + req.host  + ":" + process.env.PORT + req.url);
//         } else {
//             return next();
//         }
//     });
//
// };

// Main code
var server = new YGTApp();
server.initialize();
server.start();
