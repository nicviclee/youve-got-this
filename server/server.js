const http = require('http');
const fs = require('fs');
const app = require('express')();
const webPush = require('web-push');

var ids = {}; // holds subscription ids and index of next message to send
var encouragements = []; // array of encouraging messages

var PORT = 3000;
var HOST = 'localhost';

webPush.setGCMAPIKey(/*GCM API Key*/);

http.createServer(app).listen(PORT, HOST);
console.log('HTTPS Server listening on %s:%s', HOST, PORT);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//routes
app.get('/', function (req, res) {
    console.log("GET request for encouraging message");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(getNextMessage());
    res.end();
});

app.post('/register', function (req, res) {
    console.log("POST to register endpoint");
    //console.log("Req data: " + req.data);
    
    var body = "";

    req.on('data', function(chunk) {
      body += chunk;
    });

    req.on('end', function() {
        if (!body) return;
        var obj = JSON.parse(body);
        console.log("Req body: " + body);
        
        var params = {
            userPublicKey: obj.keys.p256dh,
            userAuth: obj.keys.auth,
            payload: JSON.stringify({
                title: 'Placeholder-Name',
                message: 'Thanks for registering! Be prepared to be encouraged.'
            })
        };
        
        console.log('user public key: ' + obj.keys.p256dh);
        console.log('userAuth: ' + obj.keys.auth);
        console.log('endpoint: ' + obj.endpoint);
        
        webPush.sendNotification(obj.endpoint, params);
    });
        
        
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Subscription has been registered');
    res.end();
});

app.post('/unregister', function (req, res) {
    console.log("POST to unregister endpoint");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Endpoint has been removed');
    res.end();
});

function getNextMessage(user){
    return "You can do it!!!";
}