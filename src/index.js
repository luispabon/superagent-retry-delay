/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  const Request = superagent.Request

  Request.prototype.oldRetry = Request.prototype.retry
  Request.prototype.retry = retry
  Request.prototype.callback = callback

  return superagent
}

/**
 * Works out whether we should retry, based on the number of retries, on any passed
 * errors and response.
 *
 * @param {Number} retries
 * @param {Error} err
 * @param {Response} res
 */
function shouldRetry(err, res) {

  // On any error, retry
  if (err !== null && err !== undefined) {
    return true
  }

  // Some responses are non-success, yet no error is thrown - inspect status
  if (res.status < 200 || res.status >= 400) {
    return true
  }

  return false
}

/**
 * Override Request callback to set a timeout on the call to retry.
 *
 * This overrides crucial behaviour: it will retry on ANY error (eg 401...) due to shouldRetry having 
 * different behaviour.
 *
 * @param err
 * @param res
 * @return {Object}
 */
function callback(err, res) {
  if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
    var req = this
    return setTimeout(function () {
      return req._retry()
    }, this._retryDelay)
  }

  var fn = this._callback
  this.clearTimeout()

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1
    this.emit('error', err)
  }

  fn(err, res)
}


/**
 * Override Request retry to also set a delay.
 *
 * In miliseconds.
 *
 * @param {Number} retries
 * @param {number} delay
 * @return {retry}
 */
function retry(retries, delay) {
  this._retryDelay = delay || 0
  return this.oldRetry(retries)
}
