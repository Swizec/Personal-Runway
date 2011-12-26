
var https = require('https'),
    querystring = require('querystring');

https.get({hostname: 'www.toggl.com',
           path: '/api/v6/time_entries.json?'+querystring.stringify({

           }),
           auth: require('./secrets').toggl_api+':api_token'
          },
          function (res) {
              res.setEncoding('utf8');
              res.on('data', function (chunk) {
                  console.log("CHUNK: "+chunk);
              });
          }).on('error', function (e) {
              console.log("Got error:", e.message);
          });
