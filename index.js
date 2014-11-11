var express     =   require('express');
var cheerio     =   require('cheerio');
var bodyParser  =   require('body-parser');
var request     =   require('request');
var moment      =   require('moment');
var async       =   require('async');
var baseUrl = 'http://hertzfreerider.se/unauth/';

request(baseUrl + 'list_transport_offer.aspx', function(error, response, html) {

  var $ = cheerio.load(html);
  var parsed = [];
  var poo = ($('tr.highlight'));
  async.eachSeries(poo.splice(0, 2), function(item, theCallback) {
    var anchors = $(item).find('a');
    var additionalInfo = $(item).next().find('td span');
    var startDate = moment(additionalInfo.eq(0).text()).format();
    var endData = moment(additionalInfo.eq(1).text()).format();
    var car = additionalInfo.eq(2).text();

    var fromStationId = anchors.eq(0).attr('href').split('stationId=')[1];
    var toStationId = anchors.eq(1).attr('href').split('stationId=')[1];

    async.parallel([function(callback) {
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
        };

        callback(null, stationData);
      })
    }, function(callback) {
      request(baseUrl + 'stationInfo.aspx?stationId=' + toStationId, function(error, response, html) {
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
        };

        callback(null, stationData);
      });
    }], function(err, result) {
      parsed.push({
        from: {
          name: anchors.eq(0).text(),
          id: fromStationId,
          station: result[0]
        },
        to: {
          name: anchors.eq(1).text(),
          id: toStationId,
          station: result[1]
        },
        car: car,
        startData: startDate,
        endData: endData
      });
      theCallback();
    });
  }, function() {
    console.log(JSON.stringify(parsed[0]));
  });
});





