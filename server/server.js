const http = require('http');
const fs = require('fs');
const app = require('express')();

var PORT = 8000;
var HOST = 'localhost';

server = http.createServer(app).listen(PORT, HOST);
console.log('HTTPS Server listening on %s:%s', HOST, PORT);

//routes
app.get('/', function (req, res) {
    console.log("There was a GET request");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('GET some encouragement. Coming soon!');
    res.end();
});

app.post('/', function (req, res) {
    console.log("There was a POST request");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('POST request to the home of all encouragement');
    res.end();
});