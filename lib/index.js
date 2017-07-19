const retries = require('./retries');


/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  const Request = superagent.Request;
  Request.prototype.retry = retry;
  return superagent;
};


/**
 * Export retries for extending
 */
module.exports.retries = retries;


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
        if (!retries || !err) {
          return fn && fn(err, res);
        }

        setTimeout(function () {
          reset(self, timeout);

          retries--;
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


/**
 * Determine whether we should retry based upon common error conditions
 * @param  {Error}    err
 * @param  {Response} res
 * @return {Boolean}
 */

function shouldRetry(err, res) {
  return retries.some(function (check) { return check(err, res); });
}
