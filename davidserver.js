var http = require('http');
var fs = require('fs');
var url = require('url');
var io = require('socket.io');

const PORT=8080;
const mainHtmlPath = __dirname + "/david.html";
console.log(mainHtmlPath);

var jsonObj = JSON.parse(fs.readFileSync('data.json', 'utf8'));

var server = http.createServer(function(request, response){
    var path = url.parse(request.url).pathname;

    console.log(path);

    switch(path){
    case '/':
    case '/david.html':
        var fullpath = mainHtmlPath;
        fs.readFile(fullpath, function(err, data){
            if (err) {
                response.writeHead(404);
                response.write("oops file does not exist - 404");
            } else {
                response.writeHead(200, {"Content-Type" : "text/html"});
                response.write(data, "utf8");
            }
            response.end();
        });
        break;

    default:
        response.writeHead(404);
        response.write("oops 404");
        response.end();
    }
});
server.listen(PORT);

var io2 = io.listen(server);

io2.sockets.on('connection', function(socket){
    var connId = socket.conn.id;
    console.log("connected " + connId);
    socket.on('disconnection', function(){
        console.log("disconnected " + connId);
    });
    socket.on('register', function(data){
        console.log('register req');
        socket.emit('onReadExamples', jsonObj);
    });
});
