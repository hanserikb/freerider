var express         =   require('express');
var bodyParser      =   require('body-parser');
var freeriderParser =   require('./freerider-scraper');

var app = express();




app.get('/', function(req, res) {
  freeriderParser(function(error, result) {
    if(error) {
      res.json(500, error);
    } else {
      res.json(result);
    }
  });
});

app.listen(3001);
