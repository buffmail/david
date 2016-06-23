"use strict";
let socket = io.connect('http://' + location.host);
let params = {}

if (location.search){
    const parts = location.search.substring(1).split('&');

    for (var i = 0; i < parts.length; i++) {
        const nv = parts[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }
}

function HandleWordResponse(data){
    $('#id_title').text(data.word);
    let pronoun = '';
    let definition = '';
    data.pronounciations.forEach(function(val){
        if (pronoun)
            pronoun += '\n';
        pronoun += val;
    });
    data.definitions.forEach(function(val){
        if (definition)
            definition += '\n';
        definition += val;
    });
    $('#id_pronoun').text(pronoun);
    $('#id_definition').text(definition);

    const examples = data.examples;
    const len = examples.length;
    for (let i=0; i<len; i++)
    {
        const sentence = examples[i].sentence;
        const meaning = examples[i].meaning;

        const sentenceTag =
            $('<a href="#" style="white-space: normal; padding: 0px 0px 0px 20px;"/>')
              .append(
                  $('<p style="white-space: normal; margin: 10px 0px 10px 0px;"/>').append(
                      $('<strong/>').append(sentence)))
              .append($('<p style="white-space: normal; margin: 10px 0px 10px 0px;"/>').append(
                  meaning));

        const addTag = $('<a href="#" data-icon="plus"/>');

        $('#id_examples').append(
            $('<li/>')
                .append(sentenceTag)
                .append(addTag)
        );
    }

    $('#id_examples').listview('refresh');
}

$(document).ready(function(){
    const word = params.word ? params.word : 'word';
    socket.emit('req_word', {word:word});
    socket.on('res_word', HandleWordResponse);
});

