var express = require('express')
var app = express()
var io = require('socket.io');
var fs = require('fs');
var url = require('url');
var leftpad = require('left-pad');

const PORT=8080;
const mainHtmlPath = __dirname + "/public/david.html";
const JSON_FILE_NAME = 'data.json';

var jsonObjs = JSON.parse(fs.readFileSync(JSON_FILE_NAME, 'utf8'));

app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'pug')
app.set('views', __dirname + '/views');
app.get('/', function(req, res, next) {
    res.sendFile(mainHtmlPath);
});

app.use(function(req, res, next){
    res.status(404).render('404', {url: req.originalUrl});
});

var io2 = io.listen(app.listen(PORT));

function GetDateStr(date){
    return date.getFullYear() + '-'
        + leftpad(date.getMonth() + 1, 2, 0) + '-'
        + leftpad(date.getDate(), 2, 0);
}

function GetTotalDays(dateStr, dayOffset){
    var d = new Date(dateStr);
    d.setDate(d.getDate() + dayOffset);
    return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

function fnGetDayJson(jsonObjs, dayOffset, prevSide){
    var todayStr = GetDateStr(new Date())
    var reqDays = GetTotalDays(todayStr, dayOffset);
    var nowDays = GetTotalDays(todayStr, 0);

    var len = jsonObjs.length
    for (var i = 0; i < len; i++)
    {
        var jsonObj = jsonObjs[i];
        var days = GetTotalDays(jsonObj.date, 0);
        if (reqDays < days) {
            if (i == 0) {
                return [days - nowDays, jsonObj];
            }
            var idx = prevSide ? i - 1 : i;
            jsonObj = jsonObjs[idx];
            days = GetTotalDays(jsonObj.date, 0);
            return [days - nowDays, jsonObj];
        }
        if (reqDays == days) {
            return [dayOffset, jsonObj];
        }
        if (i == jsonObjs.length - 1) {
            return [days - nowDays, jsonObj];
        }
    }

    return [0, null];
}

function AddExample(jsonObjs, example){
    var nowDays = GetTotalDays(GetDateStr(new Date()), 0);
    var resultJsonObj = null;

    var len = jsonObjs.length
    for (var i = 0; i < len; i++){
        var jsonObj = jsonObjs[i];
        var days = GetTotalDays(jsonObj.date, 0);

        if (days == nowDays) {
            resultJsonObj = jsonObj;
            break;
        }
    }

    if (!resultJsonObj){
        var dateStr = GetDateStr(new Date());
        resultJsonObj = {date:dateStr, data:[]};
        jsonObjs.push(resultJsonObj);
    }
    resultJsonObj.data.push({word:'', example:example});
    fs.writeFile(JSON_FILE_NAME, JSON.stringify(jsonObjs, null, 4));
    return resultJsonObj;
}

function DeleteExample(jsonObjs, reqOffset, index){
    var rets = fnGetDayJson(jsonObjs, reqOffset, true);
    var dayOffset = rets[0];
    var jsonObj = rets[1]
    if (dayOffset != reqOffset){
        console.log('reqOffset', reqOffset, ' mismatch dayoffset'
                    , dayOffset)
        return
    }

    if (index >= jsonObj.data.length){
        console.log('index', index, ' exceeds array size'
                    , jsonObj.data.length)
        return
    }

    console.log('deleting ', reqOffset, index
                , 'example :', jsonObj.data[index].example)
    jsonObj.data.splice(index, 1)
    fs.writeFile(JSON_FILE_NAME, JSON.stringify(jsonObjs, null, 4));
    return jsonObj
}

io2.sockets.on('connection', function(socket){
    var connId = socket.conn.id;
    console.log("connected " + connId);
    socket.on('disconnection', function(){
        console.log("disconnected " + connId);
    });
    socket.on('req_example', function(data){
        var reqDayOffset = data.day_offset;
        var delta = data.delta;
        var ret = fnGetDayJson(jsonObjs, reqDayOffset + delta, delta < 0);
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
    socket.on('delete_example', function(data){
        var reqDayOffset = data.day_offset;
        var index = data.index;
        jsonObj = DeleteExample(jsonObjs, reqDayOffset, index);
        if (jsonObj){
            var retJsonObj = JSON.parse(JSON.stringify(jsonObj))
            retJsonObj.day_offset = reqDayOffset;
            socket.emit('res_example', retJsonObj);
        }
    });
});

