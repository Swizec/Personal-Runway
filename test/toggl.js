
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var toggl = require('../fetching/toggl');

describe('toggl fetching', function () {

    // this is a simple integration test
    it('should fetch data', function (done) {
        
        toggl.fetch_data(function (err, data) {
            
            var Y = new Date().getFullYear();
            for (var i=1; i<=365; i++) {
                data.should.have.property(Y+'-'+i);
            }

            done();
        });

    });

});
