
var fs = require('fs'),
    csv = require('csv'),
    moment = require('moment');

var parsed = {};

csv().fromPath('./dataset/toshl.csv')
     .transform(function (row) {
         return [moment(new Date(row[0])).format('YYYY-DDD'),
                 row[2]];
     })
    .on('data', function (row) {
        var day = row[0];
        parsed[day] = (parsed[day]) ? parsed[day]+parseFloat(row[1]) : parseFloat(row[1]);
    })
    .on('end', function () {
        fs.writeFile('./dataset/toshl.json', JSON.stringify(parsed), 'utf8');
    });
