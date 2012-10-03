
var fs = require('fs'),
    csv = require('csv'),
    moment = require('moment'),
    request = require('superagent'),
    https = require('https'),
    querystring = require('querystring'),
    secrets = require('./secrets'),
    _ = require('underscore'),
    fx = require('money'),
    rates = require('./rates');


exports.fetch_data = function (callback) {

    exchange_rates(function (err) {
        if (err) return callback(err);

        login(function (err, cookies) {
            if (err) return callback(err);
            
            fetch(cookies, function (err, data) {
                if (err) return callback(err);

                parse(data, function (err, data) {
                    callback(err, data);
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

var login = function (callback) {
    var req = https.request({host: 'toshl.com',
                             path: '/login/',
                             method: 'POST',
                             headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
                           function (res) {
                               callback(null, res.headers['set-cookie']);
                           });

    req.write(querystring.stringify({
        email: secrets.toshl.email,
        password: secrets.toshl.password
    }));

    req.end();
};

var fetch = function (cookies, callback) {
    var req = https.request({host: 'toshl.com',
                             path: '/export/',
                             method: 'POST',
                             headers: {Cookie: cookies[0].split(';')[0],
                                       'Content-Type': 'application/x-www-form-urlencoded'}},
                      function (res) {
                          res.setEncoding('utf8');
                          var data = '';

                          var write = function () {
                              callback(null, data);
                          };

                          res.on('data', function (chunk) { data+=chunk;});
                          res.on('end', write);
                       //   res.on('close', write);
                      });
    req.write(querystring.stringify({
        year: '2011',
        time: 'all',
        type: 'Text'
    }));
    req.end();
};

var matify = function (data) {
    return _.values(data).join('\r\n');
};

var fix_data = function (data) {
    var years = [], _data = {};

    _.keys(data).filter(function (key) {
        return key.split('-')[0] >= 2011;
    }).map(function (key) {
        var _key = key.split('-'), year = _key[0];

        if (years.indexOf(year) < 0) {
            // leap year
            var days = (year%400 == 0 || (year%4 == 0 && year%100 != 0)) ? 366 : 365;
            for (var i=1; i<=days; _data[year+'-'+(i++)] = {'-': 0, '+': 0}) {}
            years.push(year);
        }
        _data[key] = data[key];
    });

    return _data;
};

var parse = function (data, callback) {
    var parsed = {};
    csv()
        .from(data)
        .transform(function (row) {
            return [moment(new Date(row[0])).format('YYYY-DDD'),
                    row[2],
                    row[3],
                    row[4]];
        })
        .on('data', function (row) {
            var day = row[0],
                expense = parseFloat(row[1]) || 0,
                income = parseFloat(row[2]) || 0,
                currency = row[3];
            if (currency.length <= 3 && currency != 'EUR') {
                if (currency == 'km') currency = 'BAM'; // this is a hack

                expense = fx.convert(expense, {from: currency, to: 'EUR'});
                income = fx.convert(income, {from: currency, to: 'EUR'});
            }
            if (parsed[day]) {
                parsed[day]['-'] += expense;
                parsed[day]['+'] += income;
            }else{
                parsed[day] = {'-': expense, '+': income};
            }
        })
        .on('end', function () {
            parsed = fix_data(parsed);

            callback(null, parsed);
        });
};
