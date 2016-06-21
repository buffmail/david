"use strict";
const request = require('request');
const cheerio = require('cheerio');
const util = require('util');
const trim = require('trim');

const URL_BASE = 'http://m.endic.naver.com/'

const USER_AGENT = 'Mozilla/5.0 ' +
    '(Macintosh; Intel Mac OS X 10_10_1) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/39.0.2171.99 Safari/537.36'

function GetWordPage(err, res, html){
    if (err){
        console.log(err);
        return;
    }

    let word = {word:'', definitions:[], pronounciations:[],
               examples:[]};

    const $ = cheerio.load(html);
    word.word = trim($("div.entry_word > h3.h_word").text());

    $("div.entry_word > p.desc_lst > span.desc").each(function(){
        word.definitions.push($(this).text());
    });

    $("span.pronun").each(function(){
        word.pronounciations.push(trim($(this).text()));
    });

    function PrintSentence(exampleTag){
        const elem = $(exampleTag)
        let sentence = ''

        elem.contents().each(function(){
            switch (this.nodeType){
            case 1: // Node.ELEMENT_NODE
                const childElem = $(this);
                if (childElem.prop("tagName") == "SPAN" &&
                    childElem.hasClass("autolink")){
                    if (sentence)
                        sentence += ' ';
                    sentence += childElem.text();
                }
                break;

            case 3: // Node.TEXT_NODE
                const rawtext = trim(this.data);
                if (!rawtext)
                    break;
                if (sentence && rawtext != ".")
                    sentence += ' ';
                sentence += rawtext;
                break;
            }
        });
        return sentence
    };

    let example = {};
    const exampleTags = $("li.example_itm");
    exampleTags.children().each(function(){
        const elem = $(this);
        if (elem.parent().css("display") == "none")
            return;
        if (elem.prop("tagName") == "P" &&
            elem.hasClass("example_stc"))
            example.sentence = PrintSentence(this);
        if (elem.prop("tagName") == "P" &&
            elem.hasClass("example_mean"))
            example.meaning = elem.text();
        if (example.sentence && example.meaning){
            word.examples.push(example);
            example = {};
        }
    });

    return word;
}

function RoutePage(err, res, html, callback){
    const $ = cheerio.load(html);

    const firstTag = $("div.word_wrap > a.h_word")[0];
    if (!firstTag){
        console.log('Cannot find redir url');
        return;
    }

    const redirUrl = URL_BASE + firstTag.attribs.href;
    request(
        {url:redirUrl, headers:{'User-Agent': USER_AGENT}},
        function(err, res, html){
            let retObj = GetWordPage(err, res, html);
            callback(retObj);
        }
    );
}

function get_examples(engword, callback){
    const initUrl = util.format(
        "%ssearch.nhn?searchOption=all&query=%s&=", URL_BASE, engword);

    request(
        {url:initUrl, headers:{'User-Agent': USER_AGENT}},
        function(err, res, html){
            RoutePage(err, res, html, callback);
        }
    );
}

module.exports = get_examples;
