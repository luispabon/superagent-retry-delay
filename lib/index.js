/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  const Request = superagent.Request;
  Request.prototype.retry = retry;
  return superagent;
};

function shouldRetry(retries, err) {
  if (retries > 0 && err !== undefined) {
    return true
  }

  return false
}

/**
 * Sets the amount of times to retry the request and the delay in miliseconds
 * 
 * @param  {Number} retries
 * @param  {Number} delay 
 */
function retry(retries, delay) {

  const self = this
  const oldEnd = this.end;

  retries = retries || 1;

  this.end = function (fn) {
    const timeout = this._timeout;

    function attemptRetry() {
      return oldEnd.call(self, function (err, res) {
        if (shouldRetry(retries, err) === false) {
          return fn && fn(err, res);
        }

        retries--;

        setTimeout(function () {
          reset(self, timeout);

          return attemptRetry();
        }, delay);
      });
    }

    return attemptRetry();
  };

  return this;
}


/**
 * HACK: Resets the internal state of a request.
 */
function reset(request, timeout) {
  const headers = request.req._headers;
  const path = request.req.path;

  request.req.abort();
  request.called = false;
  request.timeout(timeout);
  delete request.req;
  delete request._timer;

  for (var k in headers) {
    request.set(k, headers[k]);
  }

  if (!request.qs) {
    request.req.path = path;
  }
}
