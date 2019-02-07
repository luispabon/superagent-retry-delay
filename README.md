# superagent-retry-delay

  Extends the node version of [superagent's](https://github.com/visionmedia/superagent) `Request`, adds a `.retry` method to add retrying logic to the request. Calling this will retry the request however many additional times you'd like after a specified delay in miliseconds.

  It will retry on any error condition, except for the list of response codes optionally supplied.

  v2 relies on superagent's internal retry mechanism for retrying, added on superagent 3.5. Use v1 otherwise.

  This library is based on [superagent-retry](https://github.com/segmentio/superagent-retry) and extends [superagent](https://github.com/visionmedia/superagent)

## Usage

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

  Ensure your mocha timeout for tests (default is 2000ms) is long enough to accommodate for all possible retries, including the specified delays.

## Retrying Cases

  Currently the retrying logic checks for any error, but it will allow a list of status codes to avoid retrying - this is handy if you're testing say 404's.


## License

(The MIT License)

Copyright (c) 2013 Luis Pabon &lt;http://github.com/luispabon&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
