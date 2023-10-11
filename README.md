# superagent-retry-delay

Extends the node version of [superagent's](https://github.com/visionmedia/superagent) `Request`, adds a `.retry` method
to add retrying logic to the request. Calling this will retry the request however many additional times you'd like after
a specified delay in miliseconds.

It will retry on any error condition, except for the list of response codes optionally supplied.

v2 relies on superagent's internal retry mechanism for retrying, added on superagent 3.5. Use v1 otherwise.

This library is based on [superagent-retry](https://github.com/segmentio/superagent-retry) and
extends [superagent](https://github.com/visionmedia/superagent)

## Usage

The main addition over superagent is the retry function:

```javascript
/**
 * @param {Number} retries
 * @param {Number[] || Number} delays
 * @param {Number[]} allowedStatuses
 * @param {retryCallback} retryCallback
 * @callback retryCallback
 * @return {retry}
 */
function retry (retries, delays, allowedStatuses, retryCallback) {}
```

**Function params:**

* `retries`: max number of retries to attempt
* `delays`: delay between retries, in seconds. It can be either:
    * **a single number:** delay between all retries
    * **a list of numbers:** delays between the first few retries, in order given. If there are more retries than
      numbers on this list, any subsequent retries will be delayed by the last number on the list.
* `allowedStatuses`: list of HTTP statuses that aren't considered a failure by which we need to retry
* `retryCallback`: this callback takes a single argument, the `response` object, and must performs an evaluation on it
  that must return either `true` or `false`. Returning `false` stops any further retries.

### Examples
```javascript
// With superagent
const superagent = require('superagent');
require('superagent-retry-delay')(superagent);

superagent
  .get('https://segment.io')
  .retry(2, 5000, [401, 404]) // retry twice before responding, wait 5 seconds between failures, do not retry when response is success, or 401 or 404
  .end(onresponse);

superagent
  .get('https://segment.io')
  .retry(3, [1000, 3000, 10000], [401, 404]) // retry three times before responding, first wait 1 second, then 3 seconds, and finally 10 seconds between failures, do not retry when response is success, or 401 or 404
  .end(onresponse);

superagent
  .get('https://segment.io')
  .retry(5, [1000, 3000], [401, 404]) // retry five times before responding, first wait 1 second, and then wait 3 seconds between all other failures, do not retry when response is success, or 401 or 404
  .end(onresponse);

superagent
  .get('https://segment.io')
  .retry(5, [1000, 3000], [], (res, err) => {
    if (res.status === 400 && res.text.includes('banana')) {
      return true
    }
    return false;
  }) // retry five times before responding, first wait 1 second, and then wait 3 seconds between all other failures, retry if code is 400 and body contains banana
  .end(onresponse);

function onresponse (err, res) {
  console.log(res.status, res.headers);
  console.log(res.body);
}

```

```javascript
// With supertest
const superagent = require('superagent');
require('superagent-retry-delay')(superagent);

const supertest = require('supertest');
```

## Mocha users

Ensure your mocha timeout for tests (default is 2000ms) is long enough to accommodate for all possible retries,
including the specified delays.

## Retrying Cases

Currently the retrying logic checks for any error, but it will allow a list of status codes to avoid retrying - this is
handy if you're testing say 404's.

## License

See [MIT License document](LICENSE).
