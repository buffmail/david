var http = require('http');
var fs = require('fs');
var url = require('url');
var io = require('socket.io');

const PORT=8080;
const mainHtmlPath = __dirname + "/david.html";
console.log(mainHtmlPath);

var jsonObjs = JSON.parse(fs.readFileSync('data.json', 'utf8'));

var server = http.createServer(function(request, response){
    var path = url.parse(request.url).pathname;
    console.log('GET ' + path);

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

var fnGetDay = function(dayOffset){
    var d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

var fnGetDayJson = function(jsonObjs, day){
    if (jsonObjs.length == 0){
        return {}
    }

    for (var i in jsonObjs)
    {
        var jsonObj = jsonObjs[i];
        var d = new Date(jsonObj.date);
        var days = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
        if (days == day){
            return jsonObj;
        }
    }
    return jsonObjs[jsonObjs.length - 1];
}

io2.sockets.on('connection', function(socket){
    var connId = socket.conn.id;
    console.log("connected " + connId);
    socket.on('disconnection', function(){
        console.log("disconnected " + connId);
    });
    socket.on('req_example', function(data){
        var day = fnGetDay(data.day_offset);
        var jsonObj = fnGetDayJson(jsonObjs, day);
        jsonObj.day_offset = data.day_offset;
        socket.emit('res_example', jsonObj);
    });
});
