"use strict";
const request = require('request');
const cheerio = require('cheerio');
const util = require('util');
const trim = require('trim');

var engword = 'contribution'
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

    const $ = cheerio.load(html);
    const wordEntry = trim($("div.entry_word > h3.h_word").text());
    console.log(wordEntry);

    $("div.entry_word > p.desc_lst > span.desc").each(function(){
        console.log($(this).text());
    });

    const pronoun = trim($("span.pronun").text());
    console.log(pronoun);

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
        console.log(sentence);
    };

    const examples = $("li.example_itm");
    examples.children().each(function(){
        const elem = $(this);
        if (elem.parent().css("display") == "none")
            return;
        if (elem.prop("tagName") == "P" &&
            elem.hasClass("example_stc"))
            PrintSentence(this);
        if (elem.prop("tagName") == "P" &&
            elem.hasClass("example_mean"))
            console.log(elem.text());
    });
}

if (process.argv.length > 2)
    engword = process.argv[2];

request(
    util.format("%ssearch.nhn?query=%s&searchOption=", URL_BASE, engword),
    function(err, res, html){
        const $ = cheerio.load(html);
        const formTag = $("form")[0]
        const redirUrl = URL_BASE + formTag['attribs']['action']
        request(
            {url:redirUrl, headers:{'User-Agent': USER_AGENT}},
            GetWordPage
        );
    }
);

