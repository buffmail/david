var http = require('http');
var fs = require('fs');
var url = require('url');
var io = require('socket.io');

const PORT=8080;
const mainHtmlPath = __dirname + "/david.html";
const JSON_FILE_NAME = 'data.json';
console.log(mainHtmlPath);

var jsonObjs = JSON.parse(fs.readFileSync(JSON_FILE_NAME, 'utf8'));

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

function fnGetDay(dayOffset){
    var d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

function fnGetDayJson(jsonObjs, dayOffset){
    var reqDays = fnGetDay(dayOffset);
    var nowDays = fnGetDay(0);

    for (var i in jsonObjs)
    {
        var jsonObj = jsonObjs[i];
        var d = new Date(jsonObj.date);
        var days = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
        if (reqDays < days || i == jsonObjs.length - 1) {
            return [days - nowDays, jsonObj];
        }
        if (reqDays == days) {
            return [dayOffset, jsonObj];
        }
    }

    return [0, null];
}

function AddExample(jsonObjs, example){
    var nowDays = fnGetDay(0);

    var resultJsonObj = null;

    for (var i in jsonObjs)
    {
        var jsonObj = jsonObjs[i];
        var d = new Date(jsonObj.date);
        var days = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));

        if (days == nowDays) {
            resultJsonObj = jsonObj;
            break;
        }
    }

    if (!resultJsonObj){
        var d = new Date();
        var dateStr = d.getFullYear() + '-' +
            (d.getMonth() + 1) + '-' +
            d.getDate();
        resultJsonObj = {date:dateStr, data:[]};
    }
    resultJsonObj.data.push({word:'', example:example});
    fs.writeFile(JSON_FILE_NAME, JSON.stringify(jsonObjs, null, 4));
    return resultJsonObj;
}

io2.sockets.on('connection', function(socket){
    var connId = socket.conn.id;
    console.log("connected " + connId);
    socket.on('disconnection', function(){
        console.log("disconnected " + connId);
    });
    socket.on('req_example', function(data){
        var reqDayOffset = data.day_offset;
        var ret = fnGetDayJson(jsonObjs, reqDayOffset);
        var dayOffset = ret[0];
        var jsonObj = ret[1];
        if (!jsonObj){
            console.log('empty json data');
            return;
        }
        var retJsonObj = JSON.parse(JSON.stringify(jsonObj));
        retJsonObj.day_offset = dayOffset;
        socket.emit('res_example', retJsonObj);
    });
    socket.on('add_example', function(data){
        var example = data.example;
        var jsonObj = AddExample(jsonObjs, example);
        var retJsonObj = JSON.parse(JSON.stringify(jsonObj));
        retJsonObj.day_offset = 0;
        socket.emit('res_example', retJsonObj);
    });
});
