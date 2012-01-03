
var fs = require('fs'),
    csv = require('csv'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter,
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    secrets = require('./secrets'),
    _ = require('underscore');


exports.fetch_data = function (Callback) {

var events = new EventEmitter();

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

login();

var fetch = function (cookies) {
    var req = http.request({host: 'toshl.com',
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
                          res.on('close', write);
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
            for (var i=1; i<=days; _data[year+'-'+(i++)] = 0) {}
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
                    row[2]];
        })
        .on('data', function (row) {
            var day = row[0], val = parseFloat(row[1]);
            parsed[day] = (parsed[day]) ? parsed[day]+val : val;
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
