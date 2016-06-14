var request = require('request');
var cheerio = require('cheerio');
var util = require('util');

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

    function GetExample(exampleTag){
        var elem = $(exampleTag)
        var liTag = elem.parent();
        if (liTag.css("display") == "none")
            return;
        var sentence = ''
        elem.children().each(function(){
            if ($(this).prop("tagName") == "SPAN" &&
                $(this).hasClass("autolink")){
                sentence += $(this).text() + ' ';
            }
        });
        console.log(sentence)
        console.log(elem.contents().not(elem.children()).text());
    };

    GetExample(examples[0]);
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

