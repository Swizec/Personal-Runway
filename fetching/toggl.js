
var https = require('https'),
    querystring = require('querystring'),
    moment = require('moment'),
    _ = require('underscore'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter;

var hourly_rates = {};
var events = new EventEmitter();

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
                      hourly_rates[project.id] = project.hourly_rate;
                  });

                  events.emit('got_hourlies');
                  fetch();
              };

      res.on('data', function (chunk) { data+=chunk; });
              res.on('end', complete);
              res.on('close', complete);
          }).on('error', function (e) {
              console.log("Got error:", e.message);
          });

var fetch = function () {
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
                  res.on('end', function () {parse_data(data);});
                  res.on('close', function () {parse_data(data);});
              }).on('error', function (e) {
                  console.log("Got error:", e.message);
              });
};

events.on('got_hourlies', fetch);

var parse_data = function (data) {
    data = _.groupBy(JSON.parse(data).data.filter(function (e) { return !!e.project; }),
                     function (entry) {
                         return moment(new Date(entry.start)).format('DDD');
                     });

    var income = function (entry) {
        return hourly_rates[entry.project.id]*((new Date(entry.stop))-(new Date(entry.start)))/1000/60/60;
    };

    data = _.keys(data).map(function(day) {
        return ['2011-'+day, data[day].map(
            function (a) {return income(a);}).reduce(
                function (a,b) {return a+b;})];
    });

    fs.writeFile('../dataset/toggl.json', JSON.stringify(data), 'utf8');
};
