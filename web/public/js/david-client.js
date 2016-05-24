"use strict";

window.dayOffset = 0;
window.examples = {};
window.nextSpeak = null;
window.dailyBase = true;

var fnPlay = function(i, n){

    if (window.nextSpeak){
        clearTimeout(window.nextSpeak);
        window.nextSpeak = null;
    }

    var fnDelayPlay = function(index, repeatCount, next){
        var speaker = $('#id_voices').val();
        var timeoutVal = $('#id_slide_delay').val() * 1000;
        if (!(index in window.examples)){
            return;
        }
        var example = window.examples[index].example;
        var onNext = function(){
            var nextIndex = index;
            var nextRepeatCount = repeatCount + 1;
            if (next) {
                var repeatVal = $('#id_slide_repeat').val();
                if (repeatCount >= repeatVal){
                    nextIndex = index + 1;
                    nextRepeatCount = 1;
                }
            }
            if (!(nextIndex in window.examples)){
                nextIndex = 0;
            }
            window.nextSpeak = setTimeout(
                fnDelayPlay.bind(this
                                 , nextIndex
                                 , nextRepeatCount
                                 , next),
                timeoutVal);
        };
        var titleSentence = 'Playing (' + (index+1).toString() +
            '/' +
            window.examples.length.toString() +
            ')';
        $('#id_title_speak').text(titleSentence);
        $('#id_popup_sentence').text(example);
        responsiveVoice.speak(example, speaker, {onend:onNext});
    };

    fnDelayPlay(i, 1, n);
};

var socket = io.connect('http://' + location.host);

var fnOnResExample = function(jsonData){

    window.dayOffset = jsonData.day_offset;
    window.examples = jsonData.data;
    window.dailyBase = jsonData.daily_base

    var d = new Date(jsonData.date);

    var fnGetIdxOfWeek = function(date){
        var oneJan = new Date(date.getFullYear(), 0, 1);
        var daysFromOneJan = Math.floor(
            (date - oneJan) / (60*60*24*1000));
        var startDayOffset = 7 - oneJan.getDay();
        var idx = Math.floor(
            (daysFromOneJan - date.getDay() - startDayOffset)
                / 7);
        return idx;
    }

    var weekNum = fnGetIdxOfWeek(d) + 1;
    var dayStr = '일월화수목금토'[d.getDay()];
    var numStr = window.examples.length.toString();
    var dateStr = jsonData.date + ' (w'
        + weekNum + ','
        + dayStr + ','
        + numStr + ')';
    $('#id_date').text(dateStr);
    $('#id_examples').empty();

    var len = examples.length;
    for (var i=0; i<len; i++)
    {
        var example = examples[i].example;
        var word = examples[i].word;
        var sentence = example.replace(
            word,
            $('<strong/>').text(word).prop('outerHTML'));
        sentence = (i+1).toString() + '. ' + sentence;

        var sentenceTag =
            $('<a href="#" style="white-space: normal;"/>')
            .append(sentence);

        var play = function(idx){
            $('#id_page_dialog_speak').popup('open');
            fnPlay(idx, false);
        };

        sentenceTag.click(play.bind(this, i));

        var fnDeleteExample = function(dayOffset, index){
            socket.emit('delete_example'
                        , {day_offset:dayOffset
                           , index:index
                           , daily_base:window.dailyBase});
        };

        var deleteTag = $('<a href="#" data-icon="delete"/>');
        deleteTag.click(
            fnDeleteExample.bind(this, dayOffset, i));

        $('#id_examples').append(
            $('<li/>')
                .append(sentenceTag)
                .append(deleteTag)
        );
    }

    $('#id_examples').listview('refresh');
}

$(document).ready(function(){

    socket.emit('req_example'
                ,{day_offset:0
                  , delta:0
                  , daily_base:window.dailyBase});

    socket.on('res_example', fnOnResExample);

    $('#id_btn_play_all').click(function(){
        $('#id_page_dialog_speak').popup('open');
        fnPlay(0, true);
    });

    $('#id_btn_day_prev').click(function(){
        $(this).removeClass('ui-btn-active');
        socket.emit('req_example'
                    , {day_offset:window.dayOffset
                       , delta:-1
                       , daily_base:window.dailyBase});
    });

    $('#id_btn_dialog_add').click(function(){
        $(this).removeClass('ui-btn-active');
        $('#id_page_dialog_add').popup('open');
        $('#id_new_example').focus();
        $('#id_new_example').val('');
    });

    $('#id_btn_day_next').click(function(){
        $(this).removeClass('ui-btn-active');
        socket.emit('req_example',
                    {day_offset:window.dayOffset
                     , delta:1
                     , daily_base:window.dailyBase});
    });

    $('#id_btn_send_new_example').click(function(){
        var inputElem = $('#id_new_example');
        var example = inputElem.val();
        if (example.length == 0)
            return;
        socket.emit('add_example'
                    ,{example:example
                      , daily_base:window.dailyBase});
        inputElem.val('');
        $('#id_page_dialog_add').popup('close');
    });

    $('#id_new_example').keyup(function(event){
        if (event.keyCode == 13) {
            $('#id_btn_send_new_example').click();
        }
    });

    $('#id_page_dialog_speak').bind({
        popupafterclose: function(event, ui){
            if (window.nextSpeak){
                clearTimeout(window.nextSpeak);
                window.nextSpeak = null;
            }
            responsiveVoice.cancel();
        }
    });

    $('#id_btn_toggle_daily_base').click(function(){
        window.dailyBase = !window.dailyBase;
        $(this).text(window.dailyBase ? "Daily" : "Weekly");
    });

    $(window).keypress(function(e) {
        var popupElem = $('#id_page_dialog_add');
        if (popupElem.parent().hasClass("ui-popup-active")){
            return;
        }
        var ev = e || window.event;
        var key = ev.keyCode || ev.which;
        if (key == 105){
            $('#id_btn_dialog_add').click();
            return false;
        }
    });
}); // ready()

