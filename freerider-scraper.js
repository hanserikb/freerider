var cheerio     =   require('cheerio');
var moment      =   require('moment');
var async       =   require('async');
var redis       =   require('redis');
var request     =   require('request');
var client      =   redis.createClient();
var baseUrl = 'http://hertzfreerider.se/unauth/';


module.exports = function(moduleCallback) {
  request(baseUrl + 'list_transport_offer.aspx', function(error, response, html) {
    if (error || response.statusCode !== 200) {
      moduleCallback(new Error('Hertzfreerider.com not responding'));
      return;
    }
    var $ = cheerio.load(html);
    var parsed = [];
    var rideCitiesNodes = ($('tr.highlight'));
    async.eachSeries(rideCitiesNodes, function(item, eachSeriesCallback) {
      var anchors = $(item).find('a');
      var additionalInfo = $(item).next().find('td span');
      var startDate = moment(additionalInfo.eq(0).text()).format();
      var endData = moment(additionalInfo.eq(1).text()).format();
      var car = additionalInfo.eq(2).text();

      var fromStationId = anchors.eq(0).attr('href').split('stationId=')[1];
      var toStationId = anchors.eq(1).attr('href').split('stationId=')[1];

      async.parallel([function(parallelCallback) {
        checkCache(fromStationId, function(error, result) {
          if (error) {
            parallelCallback(error);
            return;
          }

          parallelCallback(null, result);
        });
      }, function(parallelCallback) {
        checkCache(toStationId, function(error, result){
          if (error) {
            parallelCallback(error);
            return;
          }
          parallelCallback(null, result);
        });
      }], function(error, result) {
        if (error) {
          eachSeriesCallback(error);
        } else {
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
          eachSeriesCallback(null);
        }
      });
    }, function() {
      moduleCallback(null, parsed)
    });
  });
};

function checkCache(stationId, callback) {
  client.get(stationId, function(error, reply) {
    if(error) {
      callback(error);
      return;
    }
    if (reply) {
      callback(null, JSON.parse(reply));
    } else {
      scrapeStation(stationId, function(error, stationData) {
        if (error) {
          callback(error);
          return;
        }
        client.set(stationId, JSON.stringify(stationData));
        callback(null, stationData);
      });
    }
  });
}

function scrapeStation(stationId, callback) {

  request(baseUrl + 'stationInfo.aspx?stationId=' + stationId, function(error, response, html) {
    if (error || response.statusCode !== 200) {
      callback(error);
      return;
    }
    var $$ = cheerio.load(html);
    var scraped = $$('.displayDriverData').find('tr td');
    var mapScript = $$('form').find('script');
    var stationData = {
      location: {
        street: scraped.eq(0).find('span').eq(0).text(),
        postalCode: scraped.eq(0).find('span').eq(1).text(),
        city: scraped.eq(0).find('span').eq(2).text(),
      },
      contact: {
        email: scraped.eq(1).find('span').eq(1).text(),
        phone: scraped.eq(1).find('span').eq(2).text()
      }
    };
    var latLngMatch = mapScript.eq(1).text().match(/google\.maps\.LatLng\((.*)\)/);
    stationData.location.latLng = latLngMatch ? latLngMatch[1] : null;
    callback(null, stationData);
  });

}
