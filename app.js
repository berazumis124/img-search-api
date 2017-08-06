var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var PORT = process.env.PORT || 4998;
var url = process.env.MONGOURL;
var apiKey = process.env.KEY;
var cx = process.env.CX;
var request = require('request');


app.use(express.static("public"));

app.get('/search/:searchString', function(req, res) {
    var searchRes = {};
    var resArray = [];
    var offset = 1;
    var date = new Date();
    var searchString = req.params.searchString;
    if (req.query.offset != undefined) {
        offset = req.query.offset;
    }
    mongo.connect(url, function(err, db){
        db.collection('imgSearch').insert({
            searchString: searchString,
            searchDate: date
        });
        db.close();
    })
    request('https://www.googleapis.com/customsearch/v1?q='+ searchString +'&cx='+ cx +'&fileType=jpg&key='+ apiKey +'&searchType=image&start='+ offset +'', function(error, response, body) {
        var tmpSearchRes = SearchResult();
        var resArray = [];
        var resJson = JSON.parse(body);
        for (info in resJson.items){
            var searchRes = SearchResult();
            searchRes.URL = resJson.items[info].link;
            searchRes.altText = resJson.items[info].title;
            for (context in resJson.items[info].image){
                if (context == "contextLink"){
                    searchRes.pageURL = resJson.items[info].image[context];
                }
            }
            resArray.push(searchRes);
        }
        res.status(200).json(resArray);
    });
    
    function SearchResult() {
        return {
            'URL': '',
            'altText': '',
            'pageURL': ''
        };
    };
});

app.get('/recent', function(req, res){
    mongo.connect(url, function(err, db){
        db.collection('imgSearch').find().sort({_id: -1}).limit(10).toArray(function(err, data){
            res.status(200).json(data);
        });
    });
});

app.listen(PORT);
