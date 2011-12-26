
var https = require('https'),
    querystring = require('querystring');

https.get({hostname: 'www.toggl.com',
           path: '/api/v6/time_entries.json?'+querystring.stringify({
               start_date: (new Date('2011-09-01')).toISOString()
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

var parse_data = function (data) {
    console.log(JSON.parse(data));
};
