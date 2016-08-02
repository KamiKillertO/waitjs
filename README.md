
# <div align="center"><img width="200px" src="waitjs.png"></div>

The coolest way to wait
[![BuildStatus](https://travis-ci.org/KamiKillertO/waitjs.svg?branch=develop)](https://travis-ci.org/KamiKillertO/waitjs)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![](https://img.shields.io/badge/release-v0.1.0-blue.svg)](https://github.com/KamiKillertO/waitjs/releases/tag/v0.1.0)

waitjs provides you a promise-like interface to manage postponed executions.

Instead of writing :

```javascript
function delayedFn() {
    //...
};
setTimeout(delayedFn, 500);
```

 You can now write:

 ```javascript
 function delayedFn() {
     //...
 };
 wait(500).then(delayedFn);
 ```

## API

### wait(time)

Return [Wait](Wait)

#### time

Type : ```Number```

It's the time to wait before executing the registered function.


```javascript
function delayedFn() {
    //...
};
wait(1000).then(delayedFn);
```

Here we wait 1s before calling the function ```delayedFn```.

## Wait

A [promise-like](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promis) object.

### Wait prototype

<!-- #### Wait.prototype.catch(onRejected)

Appends a rejection handler callback to the Wait. -->

#### Wait.prototype.then(onFulfilled, onRejected)

Appends fulfillment and rejection handlers to the Wait.

## License

MIT
