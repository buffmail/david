"use strict";
let express = require('express')
let app = express()
let io = require('socket.io');
let fs = require('fs');
let url = require('url');
let leftpad = require('left-pad');
let get_examples = require('./get_examples');

const PORT=8080;
const JSON_FILE_NAME = 'data.json';

let jsonObjs = JSON.parse(fs.readFileSync(JSON_FILE_NAME, 'utf8'));

app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'pug')
app.set('views', __dirname + '/views');
app.get('/', function(req, res) {
    res.render('index');
});
app.get('/get_examples', function(req, res) {
    res.render('get_examples');
});

app.use(function(req, res, next){
    res.status(404).render('404', {url: req.originalUrl});
});

const io2 = io.listen(app.listen(PORT));

function GetDateStr(date){
    return date.getFullYear() + '-'
        + leftpad(date.getMonth() + 1, 2, 0) + '-'
        + leftpad(date.getDate(), 2, 0);
}

function GetTotalDays(dateStr, dayOffset){
    const d = new Date(dateStr);
    d.setDate(d.getDate() + dayOffset);
    return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

function GetDayJson(jsonObjs, dayOffset, random, prevSide){
    const todayStr = GetDateStr(new Date())
    const reqDays = GetTotalDays(todayStr, dayOffset);
    const nowDays = GetTotalDays(todayStr, 0);

    const len = jsonObjs.length

    if (random){
        console.assert(len != 0, "length should be greater than 0")

        const randIdx = Math.floor((Math.random() * len));
        const jsonObj = jsonObjs[randIdx]
        const days = GetTotalDays(jsonObj.date, 0);
        return [days - nowDays, jsonObj]
    }

    for (var i = 0; i < len; i++){
        let jsonObj = jsonObjs[i];
        let days = GetTotalDays(jsonObj.date, 0);
        if (reqDays < days) {
            if (i == 0) {
                return [days - nowDays, jsonObj];
            }
            const idx = prevSide ? i - 1 : i;
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
    const nowDays = GetTotalDays(GetDateStr(new Date()), 0);
    let resultJsonObj = null;

    const len = jsonObjs.length
    for (let i = 0; i < len; i++){
        const jsonObj = jsonObjs[i];
        const days = GetTotalDays(jsonObj.date, 0);

        if (days == nowDays) {
            resultJsonObj = jsonObj;
            break;
        }
    }

    if (!resultJsonObj){
        const dateStr = GetDateStr(new Date());
        resultJsonObj = {date:dateStr, data:[]};
        jsonObjs.push(resultJsonObj);
    }
    resultJsonObj.data.push({word:'', example:example});
    fs.writeFile(JSON_FILE_NAME, JSON.stringify(jsonObjs, null, 4));
    return resultJsonObj;
}

function DeleteExample(jsonObjs, reqOffset, index){
    const rets = GetDayJson(jsonObjs, reqOffset, false, true);
    const dayOffset = rets[0];
    const jsonObj = rets[1]
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
    const connId = socket.conn.id;
    console.log("connected " + connId);
    socket.on('disconnection', function(){
        console.log("disconnected " + connId);
    });
    socket.on('req_example', function(data){
        const reqDayOffset = data.day_offset;
        const delta = data.delta;
        const random = data.random;
        const ret = GetDayJson(jsonObjs, reqDayOffset + delta, random
                             , delta < 0);
        const dayOffset = ret[0];
        const jsonObj = ret[1];
        if (!jsonObj){
            console.log('empty json data');
            return;
        }
        let retJsonObj = JSON.parse(JSON.stringify(jsonObj));
        retJsonObj.day_offset = dayOffset;
        retJsonObj.daily_base = data.daily_base;
        socket.emit('res_example', retJsonObj);
    });
    socket.on('add_example', function(data){
        const example = data.example;
        const jsonObj = AddExample(jsonObjs, example);
        let retJsonObj = JSON.parse(JSON.stringify(jsonObj));
        retJsonObj.day_offset = 0;
        retJsonObj.daily_base = data.daily_base;
        socket.emit('res_example', retJsonObj);
    });
    socket.on('delete_example', function(data){
        const reqDayOffset = data.day_offset;
        const index = data.index;
        const jsonObj = DeleteExample(jsonObjs, reqDayOffset, index);
        if (jsonObj){
            let retJsonObj = JSON.parse(JSON.stringify(jsonObj))
            retJsonObj.day_offset = reqDayOffset;
            retJsonObj.daily_base = data.daily_base;
            socket.emit('res_example', retJsonObj);
        }
    });
    socket.on('req_word', function(data){
        const word = data.word;
        get_examples(word, function(retObj){
            socket.emit('res_word', retObj);
        });
    });
});

