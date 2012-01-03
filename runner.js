
// fetch
// feed to haskell
// get prediction
// send email

var toggl = require('./fetching/toggl'),
    toshl = require('./fetching/toshl'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

var Data = {toshl: false,
            toggl: false};

var emitter = new EventEmitter();

toggl.fetch_data(function (data) {
    console.log("toggl'd");
    if (Data.toggl) return;
    Data.toggl = data;
    emitter.emit('fetched');
});

toshl.fetch_data(function (data) {
    console.log("toshl'd");
    if (Data.toshl) return;
    Data.toshl = data;
    emitter.emit('fetched');
});


emitter.on('fetched', function () {
    if (!(Data.toshl && Data.toggl)) return;

    var last = moment(new Date('2011-12-01')).subtract("days", 14),
        now = moment(new Date());

    var _data = {},
        keys = _.keys(Data.toshl).filter(
            function (k) {
                k = moment(k, "YYYY-DDD");
                return k >= last && k <= now;
            });

    keys.map(function (k) {
        _data[k] = {'+': Data.toggl[k],
                    '-': Data.toshl[k]};
    });

    console.log(_data);
});
