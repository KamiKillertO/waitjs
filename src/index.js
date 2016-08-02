'use strict';

let self = this.self || this.window || {};

(function(local) {
    function noop() {}

    // States:
    //
    // 0 - pending
    // 1 - fulfilled with _value
    // 2 - rejected with _value
    // 3 - adopted the state of another promise, _value
    var State = {
        PENDING: 0,
        FULFILLED: 1,
        REJECTED: 2,
        ADOPTED: 3
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

    function Wait(fn) {
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
        res._id = this._id;
        handle(this, new Handler(onFulfilled, onRejected, res));
        return res;
    };

    function safeThen(self, onFulfilled, onRejected) {
        return new self.constructor(function(resolve, reject) {
            var res = new Wait(noop);
            res._id = self._id;
            res.then(resolve, reject);
            handle(self, new Handler(onFulfilled, onRejected, res));
        });
    }
    function handle(self, deferred) {
        while (self._state === State.ADOPTED) {
            self = self._value;
        }
        if (Wait._onHandle) {
            Wait._onHandle(self);
        }
        if (self._state === State.PENDING) {
            if (self._deferredState === State.PENDING) {
                self._deferredState = State.FULFILLED;
                self._deferreds.push(deferred);
                return;
            }
            if (self._deferredState === State.FULFILLED) {
                // self._deferredState = State.REJECTED;
                // self._deferreds = [self._deferreds, deferred];
                self._deferreds.push(deferred);
                return;
            }
            self._deferreds.push(deferred);
            return;
        }
        if (Array.isArray(deferred)) {
            for (var i = 0; i < deferred.length; i++) {
                handle(self, deferred[i]);
            }
        } else {
            handleResolved(self, deferred);
        }
    }

    function handleResolved(self, deferred) {
        var cb = self._state === State.FULFILLED ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            if (self._state === State.FULFILLED) {
                resolve(deferred.wait, self._value);
            } else {
                reject(deferred.wait, self._value);
            }
            return;
        }
        var ret = tryCallOne(cb, self._value);
        if (ret === IS_ERROR) {
            reject(deferred.wait, LAST_ERROR);
        } else {
            resolve(deferred.wait, ret);
        }
    }

    function resolve(self, newValue) {
        // Wait Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self) {
            return reject(
                self,
                new TypeError('A wait cannot be resolved with itself.')
            );
        }
        if (
            newValue &&
            (typeof newValue === 'object' || typeof newValue === 'function')
        ) {
            var then = getThen(newValue);
            if (then === IS_ERROR) {
                return reject(self, LAST_ERROR);
            }
            if ( then === self.then && newValue instanceof Wait ) {
                self._state = State.ADOPTED;
                self._value = newValue;
                finale(self);
                return;
            } else if (typeof then === 'function') {
                doResolve(then.bind(newValue), self);
                return;
            }
        }
        self._state = State.FULFILLED;
        self._value = newValue;
        finale(self);
    }

    function reject(self, newValue) {
        self._state = State.REJECTED;
        self._value = newValue;
        if (Wait._onReject) {
            Wait._onReject(self, newValue);
        }
        finale(self);
    }

    function finale(self) {
        if (self._deferredState === State.FULFILLED) {
            handle(self, self._deferreds);
            self._deferreds = null;
        }
        if (self._deferredState === State.REJECTED) {
            if (Array.isArray(self.deferreds)) {
                for (var i = 0; i < self._deferreds.length; i++) {
                    handle(self, self._deferreds[i]);
                }
            } else {
                handle(self, self._deferreds);
            }
            self._deferreds = null;
        }
    }

    function Handler(onFulfilled, onRejected, wait) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.wait = wait;
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
            done = true;
            resolve(wait, value);
        }, function(reason) {
            if (done) return;
            done = true;
            reject(wait, reason);
        });
        if (!done && res === IS_ERROR) {
            done = true;
            return reject(wait, LAST_ERROR);
        }
    }

    function wait(time) {
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
