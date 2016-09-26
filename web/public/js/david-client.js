"use strict";

window.dayOffset = 0;
window.examples = {};
window.nextSpeak = null;
window.dailyBase = true;

function fnPlay (i, n){

    if (window.nextSpeak){
        clearTimeout(window.nextSpeak);
        window.nextSpeak = null;
    }

    const fnDelayPlay = function(index, repeatCount, next){
        const speaker = $('#id_voices').val();
        const timeoutVal = $('#id_slide_delay').val() * 1000;
        if (!(index in window.examples)){
            return;
        }
        const example = window.examples[index].example;
        const onNext = function(){
            let nextIndex = index;
            let nextRepeatCount = repeatCount + 1;
            if (next) {
                const repeatVal = $('#id_slide_repeat').val();
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
        const titleSentence = 'Playing (' + (index+1).toString() +
            '/' +
            window.examples.length.toString() +
            ')';
        $('#id_title_speak').text(titleSentence);
        $('#id_popup_sentence').text(example);
        responsiveVoice.speak(example, speaker, {onend:onNext});
    };

    fnDelayPlay(i, 1, n);
};

let socket = io.connect('http://' + location.host);

function fnOnResExample(jsonData){

    window.dayOffset = jsonData.day_offset;
    window.examples = jsonData.data;
    window.dailyBase = jsonData.daily_base

    const d = new Date(jsonData.date);

    function fnGetIdxOfWeek(date){
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const daysFromOneJan = Math.floor(
            (date - oneJan) / (60*60*24*1000));
        const startDayOffset = 7 - oneJan.getDay();
        const idx = Math.floor(
            (daysFromOneJan - date.getDay() - startDayOffset)
                / 7);
        return idx;
    }

    const weekNum = fnGetIdxOfWeek(d) + 1;
    const dayStr = '일월화수목금토'[d.getDay()];
    const numStr = window.examples.length.toString();
    const dateStr = jsonData.date + ' (w'
        + weekNum + ','
        + dayStr + ','
        + numStr + ')';
    $('#id_date').text(dateStr);
    $('#id_examples').empty();

    const len = examples.length;
    for (let i=0; i<len; i++)
    {
        const example = examples[i].example;
        const word = examples[i].word;
        let sentence = example.replace(
            word,
            $('<strong/>').text(word).prop('outerHTML'));
        sentence = (i+1).toString() + '. ' + sentence;

        const sentenceTag =
            $('<a href="#" style="white-space: normal;"/>')
            .append(sentence);

        function play(idx){
            $('#id_page_dialog_speak').popup('open');
            fnPlay(idx, false);
        };

        sentenceTag.click(play.bind(this, i));

        let fnDeleteExample = function(dayOffset, index){
            socket.emit('delete_example'
                        , {day_offset:dayOffset
                           , index:index
                           , daily_base:window.dailyBase});
        };

        const deleteTag = $('<a href="#" data-icon="delete"/>');
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

function FilterExample(rawSentence){
    let sentence = rawSentence.replace(/\*/g, '');
    let retSentence =
        sentence.replace(/\.\n\n.*Kindle Edition.*/, '');
    if (retSentence == sentence)
        return retSentence;
    return retSentence + '.';
}

$(document).ready(function(){

    socket.emit('req_example'
                ,{day_offset:0
                  , delta:0
                  , random:false
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
                       , random:false
                       , daily_base:window.dailyBase});
    });

    $('#id_btn_dialog_add').click(function(){
        $(this).removeClass('ui-btn-active');
        $('#id_page_dialog_add').popup('open');
        $('#id_new_example').focus();
        $('#id_new_example').val('');
    });

    $('#id_btn_day_random').click(function(){
        $(this).removeClass('ui-btn-active');
        socket.emit('req_example'
                    ,{day_offset:window.dayOffset
                      , delta:0
                      , random:true
                      , daily_base:window.dailyBase});
    });

    $('#id_btn_day_next').click(function(){
        $(this).removeClass('ui-btn-active');
        socket.emit('req_example',
                    {day_offset:window.dayOffset
                     , delta:1
                     , random:false
                     , daily_base:window.dailyBase});
    });

    $('#id_btn_send_new_example').click(function(){
        const inputElem = $('#id_new_example');
        const example = FilterExample(inputElem.val());
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

    $('#id_slide_delay').on('change', function(){
        Cookies.set('slide_delay', $(this).val());
    });

    $('#id_slide_repeat').on('change', function(){
        Cookies.set('repeat_count', $(this).val());
    });

    $(window).keypress(function(e) {
        const popupElem = $('#id_page_dialog_add');
        if (popupElem.parent().hasClass("ui-popup-active")){
            return;
        }
        const ev = e || window.event;
        const key = ev.keyCode || ev.which;
        if (key == 105){
            $('#id_btn_dialog_add').click();
            return false;
        }
    });

    const timeoutVal = Cookies.get('slide_delay');
    if (timeoutVal !== undefined){
        $('#id_slide_delay').val(timeoutVal);
    }

    const repeatCount = Cookies.get('repeat_count');
    if (repeatCount !== undefined)
    {
        $('#id_slide_repeat').val(repeatCount);
    }
}); // ready()

