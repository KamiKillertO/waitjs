# <div><img width="200px" src="waitjs.png">The coolest way to wait</div>

[![BuildStatus](https://travis-ci.org/KamiKillertO/waitjs.svg?branch=develop)](https://travis-ci.org/KamiKillertO/waitjs)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![](https://img.shields.io/badge/release-v0.2.2-blue.svg)](https://github.com/KamiKillertO/waitjs/releases/tag/v0.2.2)

waitjs provides you a promise-like interface to manage postponed executions.

## Installation

waitjs is available on npm.

```bash
npm install --save @kamikillerto/wait-js
```

This will install the PeasyDB library files in your project's bower_components folder.  

waitjs is available on bower;

```bash
bower install wait-js --save
```

This will install the waitjs library files in your project's bower_components folder.  
After you just have to add `<script>` or use `require` with you favorite AMD module loader

```javascript
var wait = require('@kamikillerto/wait-js');
```

```html
<script src="bower_components/wait-js/src/wait.js"type="text/javascript"></script>
<!-- or -->
<script src="node_modules/@kamikillerto/wait-js/src/wait.js"type="text/javascript"></script>
```

## API

### wait([time[, occurence]])

Do the same thing as ```setTimeout```, delay a function call.

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

#### time

Type : ```number```

It's the time to wait before executing the registered function.

```javascript
function delayedFn() {
    //...
};
wait(1000).then(delayedFn);
```

Here we wait 1s before calling the function ```delayedFn```.

#### occurence

Type: ```number```

It allow to execute the wait handlers multiples times each time after the waiting time.

Instead of writing :

```javascript
function delayedFn() {
    //...
};

var occurence = 5,
    id = setInterval(function() {
        if(occurence === 0) {
            return clearInterval(id);
        }
        delayedFn();
        occurence--;
        return;
    }, 500);
```

 You can now write:

```javascript
function delayedFn() {
    //...
};

wait(500, 5).then(delayedFn);
```

#### return [```Wait```](Wait)

## Wait

A [promise-like](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promis) object.

### Wait prototype

#### Wait.prototype.catch(onRejected)

Appends a rejection handler callback to the Wait.

#### Wait.prototype.then(onFulfilled, onRejected)

Appends fulfillment and rejection handlers to the Wait.

## License

MIT
