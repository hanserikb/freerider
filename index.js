var express     =   require('express');
var cheerio     =   require('cheerio');
var bodyParser  =   require('body-parser');
var request     =   require('request');

request('http://hertzfreerider.se/unauth/list_transport_offer.aspx', function(error, response, html) {

  var $ = cheerio.load(html);
  var parsed = [];
  $('tr.highlight').each(function(i, item) {
    var anchors = $(item).find('a');
    var additionalInfo = $(this).next().find('td span');
    var startDate = additionalInfo.eq(0).text();
    var endData = additionalInfo.eq(1).text();
    var car = additionalInfo.eq(2).text();

    parsed.push({
      from: anchors.eq(0).text(),
      to: anchors.eq(1).text(),
      car: car,
      startData: startDate,
      endData: endData
    });
  });

});





