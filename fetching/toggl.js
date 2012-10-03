
var https = require('https'),
    querystring = require('querystring'),
    moment = require('moment'),
    _ = require('underscore'),
    fs = require('fs'),
    fx = require('money'),
    rates = require('./rates');

exports.fetch_data = function (callback) {

    exchange_rates(function (err) {
        if (err) return callback(err);

        hourlies(function (err, hourly_rates) {
            if (err) return callback(err);
            
            fetch(function (err, data) {
                if (err) return callback(err);

                parse_data(hourly_rates, data, function (err, parsed) {
                    if (err) return callback(err);

                    callback(null, parsed);
                });
            });
        });
    });
};

var exchange_rates = function (callback) {
    rates.fetch(function (err, data) {
        if (err) return callback(err);

        fx.base = data.base;
        fx.rates = data.rates;

        callback(null);
    });
};

var hourlies = function (callback) {
    var hourly_rates = {};

    https.get({hostname: 'www.toggl.com',
               path: '/api/v6/projects.json?'+querystring.stringify({
               }),
               auth: require('./secrets').toggl_api+':api_token'
              },
              function (res) {
                  res.setEncoding('utf8');
                  var data = '';
                  var complete = function () {
                      JSON.parse(data).data.map(function (project) {
                          hourly_rates[project.id] = fx.convert(project.hourly_rate,
                                                            {from:'USD',
                                                             to: 'EUR'});
                      });
                      
                      callback(null, hourly_rates);
                  };

                  res.on('data', function (chunk) { data+=chunk; });
                  res.on('end', complete);
                  // res.on('close', complete);
              }).on('error', function (e) {
                  console.log("Got error:", e.message);
                  callback(e);
              });
};


var fetch = function (callback) {
    https.get({hostname: 'www.toggl.com',
               path: '/api/v6/time_entries.json?'+querystring.stringify({
                   start_date: (new Date('2011-09-01')).toISOString(),
                   end_date: (new Date()).toISOString()
               }),
               auth: require('./secrets').toggl_api+':api_token'
              },
              function (res) {
                  res.setEncoding('utf8');
                  var data = '';

                  res.on('data', function (chunk) { data += chunk; });
                  res.on('end', function () {
                      callback(null, data);
                  });
              }).on('error', function (e) {
                  console.log("Got error:", e.message);
                  callback(e);
              });
};

var parse_data = function (hourly_rates, data, callback) {
    data = _.groupBy(JSON.parse(data).data.filter(function (e) { return !!e.project; }),
                     function (entry) {
                         return moment(new Date(entry.start)).format('YYYY-DDD');
                     });

    var income = function (entry) {
        return hourly_rates[entry.project.id]*((new Date(entry.stop))-(new Date(entry.start)))/1000/60/60;
    };

    var _data = {}, years = [];
    _.keys(data).map(function(key) {
        var year = key.split('-')[0];
        if (years.indexOf(year) < 0) {
            // leap year
            var days = (year%400 == 0 || (year%4 == 0 && year%100 != 0)) ? 366 : 365;
            for (var i=1; i<=days; _data[year+'-'+(i++)] = 0) {}
            years.push(year);
        }
        _data[key] = data[key].map(
            function (a) {return income(a);}).filter(
                function (a) {return a>=0;}).reduce(
                    function (a,b) {return a+b;}, 0);
    });

    callback(null, _data);
};
