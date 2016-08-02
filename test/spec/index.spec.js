/*

 */
"use strict";

var should = require('should');
var wait = require('../../src/index');

describe('waitjs', function () {
    it('should call callback after 1s', function(done) {
        var start = Date.now();
        function callback() {
            var end = Date.now();
            (end - start).should.be.within(980, 1020);
            done();
        }
        wait(1000).then(callback);
    });
    it('should call multiple functions', function(done) {
        var count = 0;
        function _incrementCount() {
            count++;
        }
        function callback() {
            should.equal(count, 1);
            done();
        }
        wait(1000).then(_incrementCount).then(callback);
    });
});
