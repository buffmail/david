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
    if (err){
        console.log(err);
        return;
    }

    var $ = cheerio.load(html);
    var wordEntry = $("div.entry_word > h3.h_word").text();
    console.log(wordEntry);

    var pronoun = $("span.pronun").text();
    console.log(pronoun);

    var sentence = ''
    var count = 0;
    var examples = $("li.example_itm > p.example_stc");

    function PrintSentence(exampleTag){
        var elem = $(exampleTag)
        var liTag = elem.parent();
        if (liTag.css("display") == "none")
            return;
        var sentence = ''

        elem.contents().each(function(){
            switch (this.nodeType){
            case 1: // Node.ELEMENT_NODE
                var childElem = $(this);
                if (childElem.prop("tagName") == "SPAN" &&
                    childElem.hasClass("autolink")){
                    if (sentence)
                        sentence += ' ';
                    sentence += $(this).text();
                }
                break;

            case 3: // Node.TEXT_NODE
                sentence += trim(this.data);
                break;
            }
        });
        console.log(sentence)
    };

    for (var i in examples){
        if ($(examples[i]).css("visible") != "none")
            PrintSentence(examples[i]);
    }
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

