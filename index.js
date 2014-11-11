var express     =   require('express');
var cheerio     =   require('cheerio');
var bodyParser  =   require('body-parser');
var request     =   require('request');
var moment      =   require('moment');
request('http://hertzfreerider.se/unauth/list_transport_offer.aspx', function(error, response, html) {

  var $ = cheerio.load(html);
  var parsed = [];
  $('tr.highlight').each(function(i, item) {
    var anchors = $(item).find('a');
    var additionalInfo = $(this).next().find('td span');
    var startDate = moment(additionalInfo.eq(0).text()).format();
    var endData = moment(additionalInfo.eq(1).text()).format();
    var car = additionalInfo.eq(2).text();

    var fromStationId = anchors.eq(0).attr('href').split('stationId=')[1];
    var toStationId = anchors.eq(1).attr('href').split('stationId=')[1];

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
  });
});





