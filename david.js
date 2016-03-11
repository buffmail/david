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
    $("li.example_itm > p.example_stc > span.autolink > a").each(
        function(){
            if ($(this).hasClass("hidden")){
//                return;
            }
            if (sentence.length != 0) {
                sentence += ' ';
            }
            sentence += $(this).text();
        });
    if (sentence.length){
        sentence += ".";
    }
    console.log(sentence);
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

