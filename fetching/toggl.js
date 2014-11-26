
var https = require('https'),
    querystring = require('querystring'),
    moment = require('moment'),
    _ = require('underscore'),
    fs = require('fs'),
    fx = require('money'),
    request = require('superagent'),
    async = require('async'),
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

var __request = function (url, query, callback) {
    callback = arguments[arguments.length-1];
    query = typeof query === 'function' ? {} : query;

    request.get({protocol: 'https',
                 hostname: 'www.toggl.com',
                 pathname: url,
                 query: query,
                 auth: require('./secrets').toggl_api+':api_token'})
        .set('Accept-Charset', 'utf-8')
        .set('Accept', 'application/json')
        .end(callback);
};

var workspaces = function (callback) {
    __request('/api/v8/workspaces', callback);
};

var projects = function (workspaces, callback) {
    async.map(workspaces,
              function (workspace, callback) {
                  __request('/api/v8/workspaces/'+workspace.id+'/projects', callback);
              },
              function (err, projects) {
                  if (err) return callback(err);

                  callback(null, projects.reduce(function (acc, project) { 
                      return acc.concat(project.body);
                  }, []));
              });
};

var hourlies = function (callback) {
    workspaces(function (err, res) {
        if (err) return callback(err);

        projects(res.body, function (err, projects) {
            if (err) return callback(err);

            var hourly_rates = {};
            
            projects.forEach(function (project) {
                var fee, rate = {};                
                hourly_rates[project.id] = {};

                rate['max_h'] = project.estimated_hours;                
                rate['rate'] = fx.convert(project.rate,
                                          {from: 'USD',
                                           to: 'EUR'});
                hourly_rates[project.id] = rate;
            });

            callback(null, hourly_rates);
        });
    });
};


var fetch = function (callback) {
    __request('/api/v8/time_entries',
              {
                  start_date: (new Date('2014-09-01')).toISOString(),
                  end_date: (new Date()).toISOString()
              },
              function (err, res) {
                  callback(err, res.body);
              });
};

var parse_data = function (hourly_rates, data, callback) {
    data = _.groupBy(data.filter(function (e) { return !!e.pid; }),
                     function (entry) {
                         return moment(new Date(entry.start)).format('YYYY-DDD');
                     });

    var income = function (entry) {
        var hours = entry.duration/3600,
            earned = 0,
            rate = hourly_rates[entry.pid];
    
        if (rate) {
            if (!rate.max_h || rate.max_h > 0) {
                earned = rate.rate*hours;
            }

            hourly_rates[entry.pid].max_h -= hours;
        }

        return earned;
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
