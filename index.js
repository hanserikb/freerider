var express     =   require('express');
var cheerio     =   require('cheerio');
var bodyParser  =   require('body-parser');
var request     =   require('request');
var moment      =   require('moment');
var async       =   require('async');
var redis       =   require('redis');
var client      =   redis.createClient();
var baseUrl = 'http://hertzfreerider.se/unauth/';

var app = express();



app.get('/', function(req, res) {
  request(baseUrl + 'list_transport_offer.aspx', function(error, response, html) {
    var $ = cheerio.load(html);
    var parsed = [];
    var poo = ($('tr.highlight'));
    async.eachSeries(poo, function(item, theCallback) {
      var anchors = $(item).find('a');
      var additionalInfo = $(item).next().find('td span');
      var startDate = moment(additionalInfo.eq(0).text()).format();
      var endData = moment(additionalInfo.eq(1).text()).format();
      var car = additionalInfo.eq(2).text();

      var fromStationId = anchors.eq(0).attr('href').split('stationId=')[1];
      var toStationId = anchors.eq(1).attr('href').split('stationId=')[1];

      async.parallel([function(callback) {

        client.get(fromStationId, function(err, reply) {
          console.log('Cached!', reply);
          if (reply) {
            console.log('sending cached');
            callback(null, JSON.parse(reply));
          } else {
            console.log(fromStationId, ' not cached, scraping');
            request(baseUrl + 'stationInfo.aspx?stationId=' + fromStationId, function(error, response, html) {
              var $$ = cheerio.load(html);

              var scraped = $$('.displayDriverData').find('tr td');
              var stationData = {
                location: {
                  street: scraped.eq(0).find('span').eq(0).text(),
                  postalCode: scraped.eq(0).find('span').eq(1).text(),
                  city: scraped.eq(0).find('span').eq(2).text()
                },
                contact: {
                  email: scraped.eq(1).find('span').eq(1).text(),
                  phone: scraped.eq(1).find('span').eq(2).text()
                }
              }

              client.set(fromStationId, JSON.stringify(stationData));
              callback(null, stationData);
            });
          }
        });
      }, function(callback) {
        client.get(toStationId, function(err, reply) {
          if (reply) {
            console.log('sending cached');
            callback(null, JSON.parse(reply));
          } else {
            console.log('scraping')
            request(baseUrl + 'stationInfo.aspx?stationId=' + toStationId, function(error, response, html) {
              var $$ = cheerio.load(html);

              var scraped = $$('.displayDriverData').find('tr td');
              var stationData = {
                location: {
                  street: scraped.eq(0).find('span').eq(0).text(),
                  postalCode: scraped.eq(0).find('span').eq(1).text(),
                  city: scraped.eq(0).find('span').eq(2).text()
                }, contact: {
                  email: scraped.eq(1).find('span').eq(1).text(), phone: scraped.eq(1).find('span').eq(2).text()
                }
              };

              client.set(toStationId, JSON.stringify(stationData));
              callback(null, stationData);
            });
          }
        });
      }], function(err, result) {
        parsed.push({
          from: {
            name: anchors.eq(0).text(),
            station: result[0]
          },
          to: {
            name: anchors.eq(1).text(),
            station: result[1]
          },
          car: car,
          startData: startDate,
          endData: endData
        });
        theCallback();
      });
    }, function() {
      res.json(parsed);
    });
  });
});



app.listen(3001);
