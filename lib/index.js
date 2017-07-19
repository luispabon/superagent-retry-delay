/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  const Request = superagent.Request;
  Request.prototype.retry = retry;
  return superagent;
};

/**
 * Works out whether we should retry, based on the number of retries, on any passed
 * errors and response.
 *
 * @param {Number} retries
 * @param {Error} err
 * @param {Response} res
 */
function shouldRetry(retries, err, res) {
  if (retries > 0) {
    // On any error, retry
    if (err !== null && err !== undefined) {
      return true
    }

    // Some responses are non-success, yet no error is thrown - inspect status
    if (res.status < 200 || res.status >= 400) {
      return true
    }

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

  if (retries < 1) {
    throw Error('retries must be a positive number bigger than 1')
  }

  const self = this
  const oldEnd = this.end;

  this.end = function (fn) {
    const timeout = this._timeout;

    function attemptRetry() {
      return oldEnd.call(self, function (err, res) {
        if (shouldRetry(retries, err, res) === false) {
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


