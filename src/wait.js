var self = this.self || this.window || {};

(function(local) {
    'use strict';

    function noop() {}

    // States:
    //
    // 0 - pending
    // 1 - fulfilled with _value
    // 2 - rejected with _value
    // 3 - repeat
    var State = {
        PENDING: 0,
        FULFILLED: 1,
        REJECTED: 2,
        REPEAT: 3
    };

    //  extract try/catch here to avoid using them inside critical functions
    //
    var LAST_ERROR = null;
    var IS_ERROR = {};

    function getThen(obj) {
        try {
            return obj.then;
        } catch (ex) {
            LAST_ERROR = ex;
            return IS_ERROR;
        }
    }

    function tryCallOne(fn, a) {
        try {
            return fn(a);
        } catch (ex) {
            LAST_ERROR = ex;
            return IS_ERROR;
        }
    }

    function tryCallTwo(fn, a, b) {
        try {
            return fn(a, b);
        } catch (ex) {
            LAST_ERROR = ex;
            return IS_ERROR;
        }
    }

    function Wait(fn, occurence) {
        if (typeof this !== 'object') {
            throw new TypeError('Waits must be constructed via new');
        }
        if (typeof fn !== 'function') {
            throw new TypeError('Wait contructor\'s argument not a function');
        }
        this._deferredState = State.PENDING;
        this._state = 0;
        this._value = null;
        this._deferreds = [];

        this._occurence = occurence || undefined;

        if (fn === noop) return;
        doResolve(fn, this);
    }
    Wait._onHandle = null;
    Wait._onReject = null;
    Wait._noop = noop;

    Wait.prototype.then = function(onFulfilled, onRejected) {
        if (this.constructor !== Wait) {
            safeThen(this, onFulfilled, onRejected);
        }
        var res = new Wait(noop);
        // res._id = this._id;
        handle(this, new Handler(onFulfilled, onRejected, res));
        return res;
    };

    Wait.prototype.catch = function(onRejected) {
        return this.then(null, onRejected);
    };

    function safeThen(self, onFulfilled, onRejected) {
        return new self.constructor(function(resolve, reject) {
            var res = new Wait(noop);
            // res._id = self._id;
            res.then(resolve, reject);
            handle(self, new Handler(onFulfilled, onRejected, res));
        });
    }

    function handle(self, deferred) {
        if (Wait._onHandle) {
            Wait._onHandle(self);
        }
        if (self._state === State.PENDING) {
            if (self._deferredState === State.FULFILLED) {
                self._deferredState = State.REJECTED;
                self._deferreds = [self._deferreds, deferred];
                return;
            }
            if (self._deferredState === State.PENDING) {
                self._deferredState = State.FULFILLED;
                self._deferreds = deferred;
                return;
            }
            self._deferreds.push(deferred);
            return;
        }
        return handleResolved(self, deferred);
    }

    function handleWithoutCb(self, deferred) {
        if (self._state === State.FULFILLED || self._state === State.REPEAT) {
            resolve(deferred.wait, self._value);
        } else {
            reject(deferred.wait, self._value);
        }
        self._state = deferred.wait._state;
        return;
    }
    function handleWithCb(self, deferred, cb) {
        var ret = tryCallOne(cb, self._value);
        if (ret === IS_ERROR) {
            reject(deferred.wait, LAST_ERROR);
        } else {
            resolve(deferred.wait, ret);
        }
        return;
    }
    function handleResolved(self, deferred) {
        var cb = (self._state === State.FULFILLED || self._state === State.REPEAT) ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            return handleWithoutCb(self, deferred);
        }
        return handleWithCb(self, deferred, cb);
    }

    function resolveWithValue(self, newValue)  {
        var then = getThen(newValue);
        if (then === IS_ERROR) {
            return reject(self, LAST_ERROR);
        }
        if (typeof then === 'function') {
            doResolve(then.bind(newValue), self);
            return;
        }
    }

    function resolve(self, newValue) {
        // promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self || newValue instanceof Wait) {
            LAST_ERROR = new TypeError('A wait cannot be resolved with an object Wait.');
            return reject(
                self,
                LAST_ERROR
            );
        }
        if (
            newValue &&
            (typeof newValue === 'object' || typeof newValue === 'function')
        ) {
            return resolveWithValue(self, newValue);
        }
        self._state = State.FULFILLED;
        if (self._occurence && self._occurence !== 0) {
            self._state = State.REPEAT;
        }
        self._value = newValue;
        finalize(self);
    }

    function reject(self, newValue) {
        self._state = State.REJECTED;
        self._value = newValue;
        if (Wait._onReject) {
            Wait._onReject(self, newValue);
        }
        finalize(self);
    }

    function finalize(self) {
        if (self._deferredState === State.FULFILLED) {
            handle(self, self._deferreds);
            wait._state = State.REPEAT;
            if (wait._occurence === 0) {
                self._deferreds = null;
            }
        }
        if (self._deferredState === State.REJECTED) {
            for (var index = 0; index < self._deferreds.length; index++) {
                handle(self, self._deferreds[index]);
            }
            self._deferreds = null;
        }
    }

    function Handler(onFulfilled, onRejected, wait) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.wait = wait;
    }

    function loop(fn, wait) {
        if (wait._occurence) {
            if (wait._occurence !== Infinity && --wait._occurence === 0) {
                return clearInterval(wait._id);
            }
        }
        return;
    }
    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, wait) {
        var done = false;
        var res = tryCallTwo(fn, function(value) {
            if (done) return;
            loop(fn, wait);
            resolve(wait);
        }, function(reason) {
            if (done) return;
            done = true;
            reject(wait, reason);
        });
        wait._id = res;

        if (!done && res === IS_ERROR) {
            done = true;
            return reject(wait, LAST_ERROR);
        }
    }

    function wait(time, occurence) {
        if(time !== undefined && time !== null && typeof time !== 'number') {
            throw new TypeError("Failed to execute 'wait' : argument 'time' must be a number.");
        }
        if (occurence !== undefined && occurence !== null ) {
            if (typeof occurence !== 'number') {
                throw new TypeError("Failed to execute 'wait' : argument 'occurence' must be a number.");
            }
            return new Wait(function(resolve, reject) {
                return setInterval(resolve, time);
            }, occurence);
        }
        return new Wait(function(resolve, reject) {
            return setTimeout(resolve, time);
        });
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = wait;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return wait;
        });
    } else {
        local.wait = wait;
    }
}(self));
