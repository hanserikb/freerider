var express     =   require('express');
var cheerio     =   require('cheerio');
var bodyParser  =   require('body-parser');
var request     =   require('request');
var moment      =   require('moment');
var async =         require('async');
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
        callback(null, 'one');
      })
    }, function(callback) {
      callback(null, 'two');
    }], function(err, result) {
      console.log(result)
      parsed.push({
        from: {
          name: anchors.eq(0).text(),
          id: fromStationId,
          one: result[0]
        },
        to: {
          name: anchors.eq(1).text(),
          id: toStationId,
          two: result[1]
        },
        car: car,
        startData: startDate,
        endData: endData
      });
      theCallback();
    });
  }, function() {
    console.log('done');
    console.log(parsed[0])
  });
  /*$('tr.highlight').each(function(i, item) {
    var anchors = $(item).find('a');
    var additionalInfo = $(this).next().find('td span');
    var startDate = moment(additionalInfo.eq(0).text()).format();
    var endData = moment(additionalInfo.eq(1).text()).format();
    var car = additionalInfo.eq(2).text();

    var fromStationId = anchors.eq(0).attr('href').split('stationId=')[1];
    var toStationId = anchors.eq(1).attr('href').split('stationId=')[1];

    // Fetch information about the oritin station
    request(baseUrl + 'stationInfo.aspx?stationId=' + fromStationId, function(error, response, html) {
      parsed.push({
        from: {
          name: anchors.eq(0).text(),
          id: fromStationId
        },
        to: {
          name: anchors.eq(1).text(),
          id: toStationId
        },
        car: car,
        startData: startDate,
        endData: endData
      });
      console.log('now its fetched')
    });
    console.log('im done');

  });

  async.map(parsed)
*/
});





