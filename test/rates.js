
var chai = require('chai'),
    mocha = require('mocha'),
    should = chai.should();

var rates = require('../fetching/rates');


describe('Rate fetch', function () {
    
    it('should fetch rates', function (done) {
        rates.fetch(function (err, data) {        

            data.should.have.property('rates');
            data.should.have.property('base').equal('USD');
            data.should.not.have.property('_warning');

            done();
        });
    });

});
