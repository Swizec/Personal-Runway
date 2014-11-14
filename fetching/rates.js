
var request = require('superagent'),
    URL = require('url'),
    secrets = require('../secrets');

exports.fetch = function (callback) {
    request.get({protocol: 'http',
                 hostname: 'openexchangerates.org',
                 pathname: '/api/latest.json',
                 query: {app_id: secrets.exchangerates}},
                function (res) {
                    if (res.status === 200) {
                        // ugly dirty fix for bad Toshl inputs
                        res.body.rates.kn = res.body.rates.HRK;
                        callback(null, res.body);
                    }else{
                        callback(new Error("Failed to fetch rates"));
                    }
                });
};
