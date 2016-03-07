var request = require('request');
var cheerio = require('cheerio');
var util = require('util');

var engword = 'ostensible'
var urlbase = 'http://m.endic.naver.com/'
var url1 = util.format("%ssearch.nhn?query=%s&searchOption=",
                       urlbase, engword);

var USER_AGENT = 'Mozilla/5.0 ' +
    '(Macintosh; Intel Mac OS X 10_10_1) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/39.0.2171.99 Safari/537.36'

request(
    url1,
    function(err, res, html)
    {
        var $ = cheerio.load(html);
        var formTag = $("form")[0]
        var url2 = urlbase + formTag['attribs']['action']
        console.log(url2)

        request(
            {url:url2, headers:{'User-Agent': USER_AGENT}},
            function(err, res, html)
            {
                if (err)
                {
                    console.log(err);
                    return;
                }
                console.log(html);
            }
        );
    }
);
