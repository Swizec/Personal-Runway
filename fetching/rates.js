
var request = require('superagent');

exports.fetch = function (callback) {
    request.get('http://openexchangerates.org/latest.json',
                function (res) {
                    if (res.status === 200) {
                        callback(null, res.body);
                    }else{
                        callback(new Error("Failed to fetch rates"));
                    }
                });
};
