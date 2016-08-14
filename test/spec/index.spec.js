/*

 */
"use strict";

var should = require('should');
var wait = require('../../src/wait');

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
    it('should catch the error', function(done) {
        function callback(error) {
            should.equal(Object.prototype.toString.call(error), '[object Error]');
            done();
        }
        wait(1000).then(function() {
            throw new Error('Error inside then');
        }).catch(callback);
    });
    it('should be call multiple times (parameter)', function(done) {
        var count = 0,
            occurence = 5;
        function callback() {
            count++;
            if (count === occurence){
                (true).should.be.ok();
                done();
            }
        }
        var w = wait(100, occurence).then(callback);
    });
    // it('should be call multiple times (repeat)', function(done) {
    //     var count = 0,
    //         occurence = 5;
    //     function callback() {
    //         count++;
    //         if (count === occurence){
    //             (true).should.be.ok();
    //             done();
    //         }
    //     }
    //     var w = wait(100).repeat(occurence).then(callback);
    // });
});
