
var fs = require('fs'),
    csv = require('csv'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter,
    http = require('http'),
    https = require('https'),
    querystring = require('querystring'),
    secrets = require('./secrets');

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
            fs.writeFile('./dataset/toshl.json', JSON.stringify(parsed), 'utf8');
        });
};

events.on('fetched', parse);
