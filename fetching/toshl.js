
var fs = require('fs'),
    csv = require('csv'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter,
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    secrets = require('./secrets'),
    _ = require('underscore'),
    fx = require('money'),
    rates = require('./rates');


exports.fetch_data = function (Callback) {

var events = new EventEmitter();

rates.fetch(function (err, data) {
    if (err) throw err;

    fx.base = data.base;
    fx.rates = data.rates;
    events.emit('got_rates');
});

var login = function () {
    var req = https.request({host: 'toshl.com',
                             path: '/login/',
                             method: 'POST',
                             headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
                           function (res) {
                               events.emit('logged_in', res.headers['set-cookie']);
                           });

    req.write(querystring.stringify({
        email: secrets.toshl.email,
        password: secrets.toshl.password
    }));

    req.end();

};

events.on('got_rates', login);

var fetch = function (cookies) {
    var req = https.request({host: 'toshl.com',
                             path: '/export/',
                             method: 'POST',
                             headers: {Cookie: cookies[0].split(';')[0],
                                       'Content-Type': 'application/x-www-form-urlencoded'}},
                      function (res) {
                          res.setEncoding('utf8');
                          var data = '';

                          var write = function () {
                              fs.writeFileSync('./dataset/toshl.csv', data, 'utf8');
                              events.emit('fetched');
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

events.on('logged_in', fetch);

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

var parse = function () {
    var parsed = {};
    csv().fromPath('./dataset/toshl.csv')
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

            Callback(parsed);

     //       fs.writeFile('../dataset/toshl.json', JSON.stringify(parsed), 'utf8');
     //       fs.writeFile('../dataset/toshl.txt', matify(parsed), 'utf8');
        });
};

events.on('fetched', parse);

};
