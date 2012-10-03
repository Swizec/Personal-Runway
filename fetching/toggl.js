
var https = require('https'),
    querystring = require('querystring'),
    moment = require('moment'),
    _ = require('underscore'),
    fs = require('fs'),
    fx = require('money'),
    request = require('superagent'),
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

    request.get({protocol: 'https',
                 hostname: 'www.toggl.com',
                 pathname: '/api/v6/projects.json',
                 query: {},
                 auth: require('./secrets').toggl_api+':api_token'})
        .set('Accept-Charset', 'utf-8')
        .set('Accept', 'application/json')
        .end(function (err, res) {
            if (err) return callback(err);

            var hourly_rates = {};

            res.body.data.map(function (project) {
                          hourly_rates[project.id] = fx.convert(project.hourly_rate,
                                                            {from:'USD',
                                                             to: 'EUR'});
                      });
            callback(null, hourly_rates);
        });

};


var fetch = function (callback) {

    request.get({protocol: 'https',
                 hostname: 'www.toggl.com',
                 pathname: '/api/v6/time_entries.json',
                 query: {
                     start_date: (new Date('2011-09-01')).toISOString(),
                     end_date: (new Date()).toISOString()
                 },
                 auth: require('./secrets').toggl_api+':api_token'})
        .set('Accept-Charset', 'utf-8')
        .set('Accept', 'application/json')
        .end(function (err, res) {
            callback(err, res.body);
        });

};

var parse_data = function (hourly_rates, data, callback) {
    data = _.groupBy(data.data.filter(function (e) { return !!e.project; }),
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
