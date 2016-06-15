var request = require('request');
var cheerio = require('cheerio');
var util = require('util');
var trim = require('trim');

var engword = 'word'
var urlbase = 'http://m.endic.naver.com/'
var url1 = util.format("%ssearch.nhn?query=%s&searchOption=",
                       urlbase, engword);
var url2 = ''

var USER_AGENT = 'Mozilla/5.0 ' +
    '(Macintosh; Intel Mac OS X 10_10_1) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/39.0.2171.99 Safari/537.36'

var fnGetWordPage = function(err, res, html){
    "use strict";
    if (err){
        console.log(err);
        return;
    }

    let $ = cheerio.load(html);
    let wordEntry = trim($("div.entry_word > h3.h_word").text());
    console.log(wordEntry);

    let pronoun = trim($("span.pronun").text());
    console.log(pronoun);

    let sentence = ''

    function PrintSentence(exampleTag){
        let elem = $(exampleTag)
        let sentence = ''

        elem.contents().each(function(){
            switch (this.nodeType){
            case 1: // Node.ELEMENT_NODE
                let childElem = $(this);
                if (childElem.prop("tagName") == "SPAN" &&
                    childElem.hasClass("autolink")){
                    if (sentence)
                        sentence += ' ';
                    sentence += childElem.text();
                }
                break;

            case 3: // Node.TEXT_NODE
                let lawtext = trim(this.data);
                if (!lawtext)
                    break;
                if (sentence && lawtext != ".")
                    sentence += ' ';
                sentence += lawtext;
                break;
            }
        });
        console.log(sentence)
    };

    let examples = $("li.example_itm > p.example_stc");
    examples.each(function(){
        if ($(this.parent).css("display") != "none")
            PrintSentence(this);
    });
}

request(
    url1,
    function(err, res, html){
        var $ = cheerio.load(html);
        var formTag = $("form")[0]
        url2 = urlbase + formTag['attribs']['action']
        request(
            {url:url2, headers:{'User-Agent': USER_AGENT}},
            fnGetWordPage
        );
    }
);

