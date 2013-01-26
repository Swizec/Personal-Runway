
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var toshl = require('../fetching/toshl');


describe('toshl fetch', function () {

    it('should fetch', function (done) {
        toshl.fetch_data(function (err, data) {
            var Y = new Date().getFullYear();
            for (var i=1; i<=365; i++) {
                data.should.have.property(Y+'-'+i);
            }

            done();
        });
    });

});
