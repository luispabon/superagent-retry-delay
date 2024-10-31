const http = require("http");
/**
 * Add to the request prototype.
 */

module.exports = function (superagent) {
  const Request = superagent.Request;

  Request.prototype.oldRetry = Request.prototype.retry;
  Request.prototype.retry = retry;
  Request.prototype.callback = callback;

  return superagent;
};

/**
 * Works out whether we should retry, based on the number of retries, on any passed
 * errors and response and compared against a list of allowed error statuses.
 *
 * @param {Error} err
 * @param {Response} res
 * @param {Number[]} allowedStatuses
 * @param {retryCallback} retryCallback
 * @callback retryCallback
 */
function shouldRetry(err, res, allowedStatuses, retryCallback) {
  if (retryCallback) {
    return retryCallback(err, res);
  }
  const ERROR_CODES = [
    "ECONNRESET",
    "ETIMEDOUT",
    "EADDRINFO",
    "ESOCKETTIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
  ];

  if (err && err.code && ~ERROR_CODES.indexOf(err.code)) {
    return true;
  }

  if (res && res.status) {
    const status = res.status;

    if (status >= 500) {
      return true;
    }

    if (
      (status >= 400 || status < 200) &&
      allowedStatuses.indexOf(status) === -1
    ) {
      return true;
    }
  }

  // Superagent timeout
  if (err && "timeout" in err && err.code === "ECONNABORTED") {
    return true;
  }

  return err && "crossDomain" in err;
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
  if (
    this._maxRetries &&
    this._retries++ < this._maxRetries &&
    shouldRetry(err, res, this._allowedStatuses, this._retryCallback)
  ) {
    let delay;
    if (!this._retries) {
      delay = 0;
    } else {
      delay = this._retryDelays[this._retries - 1];
    }

    const req = this;
    return setTimeout(function () {
      return req._retry();
    }, delay);
  }
  const fn = this._callback;
  this.clearTimeout();

  if (!err) {
    try {
      if (!this._isResponseOK(res)) {
        let message = "Unsuccessful HTTP response";
        if (res) {
          message = http.STATUS_CODES[res.status] || message;
        }

        err = new Error(message);
        err.status = res ? res.status : undefined;
      }
    } catch (e) {
      err = e;
      err.status = err.status || (res ? res.status : undefined);
    }
  }
  if (!err) {
    return fn(null, res);
  }

  err.response = res;

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    if (err && this.listeners("error").length > 0) {
      this.emit("error", err);
    }
  }

  fn(err, res);
}

/**
 * Override Request retry to also set delays between requests.
 *
 * In milliseconds.
 *
 * @param {Number} retries
 * @param {Number[] || Number || undefined} delays
 * @param {Number[] || undefined} allowedStatuses
 * @param {retryCallback || undefined} retryCallback
 * @callback retryCallback
 * @return {retry}
 */
function retry(retries, delays, allowedStatuses, retryCallback) {
  if (arguments.length === 0 || retries === true) {
    retries = 1;
  }

  if (retries <= 0) {
    retries = 0;
  }

  if (typeof delays === "number") {
    delays = [delays];
  }

  if (!delays) {
    delays = [0];
  }

  const numberOfDelays = delays.length;
  const diff = retries - numberOfDelays;
  if (diff !== 0) {
    if (diff < 0) {
      throw new Error("Cannot have more delays than retries");
    } else {
      // Extrapolate delays list until there is a delay for each retry
      const finalDelay = delays[numberOfDelays - 1];
      for (let i = 0; i < diff + 1; i++) {
        delays.push(finalDelay);
      }
    }
  }

  this._maxRetries = retries;
  this._retries = 0;
  this._retryDelays = delays || [0];
  this._allowedStatuses = allowedStatuses || [];
  this._retryCallback = retryCallback;
  return this;
}
