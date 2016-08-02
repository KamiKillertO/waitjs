
# <div align="center"><img width="200px" src="waitjs.png"></div>

The coolest way to wait
[![BuildStatus](https://travis-ci.org/KamiKillertO/waitjs.svg?branch=feature%20waitThenCatch)](https://travis-ci.org/KamiKillertO/waitjs)

waitjs provides you a promise-like interface to manage postponed executions.

Instead of writing :

```javascript
function delayedFn() {
    ...
};
setTimeout(delayedFn, 500);
```

 You can now write:

 ```javascript
 function delayedFn() {
     ...
 };
 wait(500).then(delayedFn);
 ```

## API

### wait(time)

## License

MIT
