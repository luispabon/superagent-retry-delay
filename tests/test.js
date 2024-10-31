/* eslint-env mocha */

const express = require("express");

const agent = require("superagent");
require("../")(agent);

require("should");
const http = require("http");

http.globalAgent.maxSockets = 2000;

describe("superagent-retry-delay", function () {
  describe("error synthesizing", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;
    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        res.sendStatus(404);
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("emits error when listener is attached", function (done) {
      let received = false;
      agent
        .get("http://localhost:" + port)
        .on("error", (err) => {
          received = true;
        })
        .end(function (err, res) {
          res.text.should.eql("Not Found");
          err.response.status.should.eql(404);
          err.status.should.eql(404);
          err.message.should.eql("Not Found");
          requests.should.eql(1);
          received.should.eql(true);
          done();
        });
    });

    it("catches errors in the _isResponseOK and returns", function (done) {
      const oldHandler = agent.Request.prototype._isResponseOK;
      agent.Request.prototype._isResponseOK = (res) => {
        throw new Error("_isResponseOK callback error");
      };
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.text.should.eql("Not Found");
        err.response.status.should.eql(404);
        err.message.should.eql("_isResponseOK callback error");
        requests.should.eql(1);
        agent.Request.prototype._isResponseOK = oldHandler;
        done();
      });
    });

    after(function (done) {
      server.close(done);
    });
  });
  describe("not-errors", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        res.send("hello!");
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("should not retry on success", function (done) {
      agent
        .get("http://localhost:" + port)
        .retry(5, 17)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(1);
          done(err);
        });
    });

    it("should not retry on success - multiple delays format", function (done) {
      agent
        .get("http://localhost:" + port)
        .retry(5, [17, 17, 17, 17, 17])
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(1);
          done(err);
        });
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("handled errors", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests === 1) {
          res.sendStatus(401);
        } else if (requests === 2) {
          res.sendStatus(409);
        } else {
          res.sendStatus(404);
        }
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("should not retry on handled errors", function (done) {
      agent
        .get("http://localhost:" + port)
        .retry(5, 13, [404])
        .end(function (err, res) {
          res.status.should.eql(404);
          requests.should.eql(3);
          err.response.status.should.eql(404);
          err.message.should.eql("Not Found");
          done();
        });
    });

    it("should not retry on handled errors - multiple delays format", function (done) {
      agent
        .get("http://localhost:" + port)
        .retry(5, [13, 13, 13, 13, 13], [404])
        .end(function (err, res) {
          res.status.should.eql(404);
          requests.should.eql(3);
          err.response.status.should.eql(404);
          err.message.should.eql("Not Found");
          done();
        });
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("errors", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests > 4) {
          res.send("hello!");
        } else {
          res.sendStatus(503);
        }
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("should retry on errors", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(503);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, 17)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          done(err);
        });
    });

    it("should retry on errors - multiple delays format", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(503);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, [17, 17, 17, 17, 17])
        .end(function (err, res) {
          res.text.should.eql("hello!");
          done(err);
        });
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("500 errors", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests > 4) {
          res.send("hello!");
        } else {
          res.sendStatus(500);
        }
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("should retry on errors", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(500);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, 13)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    it("should retry on errors - multiple delays format", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(500);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, [13, 13, 13, 13, 13])
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("404 errors", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests > 4) {
          res.send("hello!");
        } else {
          res.sendStatus(404);
        }
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("should retry on errors", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(404);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, 13)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    it("should retry on errors - multiple delays format", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(404);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, [13, 13, 13, 13, 13])
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    it("should retry on errors - no delay provided", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(404);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("401 errors", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests > 4) {
          res.send("hello!");
        } else {
          res.sendStatus(401);
        }
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
    });

    it("should retry on errors", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(401);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, 13)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    it("should retry on errors - multiple delays format", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(401);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, [13, 13, 13, 13, 13])
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("uses provided callback and not statuses", function () {
    let requests = 0;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests > 4) {
          res.send("hello!");
        } else {
          res.sendStatus(421);
        }
      });

      server = app.listen(port, done);
    });
    it("should retry if callback says to even if errorcode not included", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(421);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, 13, [419], (err, res) => {
          if (res.status !== 200) {
            return true;
          }
          return false;
        })
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(5);
          done(err);
        });
    });

    it("should not retry if callback says to even if errorcode is included", function (done) {
      agent.get("http://localhost:" + port).end(function (err, res) {
        res.status.should.eql(421);

        // appease eslint, do nothing with error to allow it to bubble up
        if (err) {
        }
      });

      agent
        .get("http://localhost:" + port)
        .retry(5, 13, [421], (err, res) => false)
        .end(function (err, res) {
          res.text.should.eql("Misdirected Request");
          requests.should.eql(2);
          err.message.should.eql("Misdirected Request");
          done();
        });
    });

    afterEach(function () {
      requests = 0;
    });

    after(function (done) {
      server.close(done);
    });
  });

  describe("specifying different delays between retries", function () {
    let requests = 0;
    let delays;
    let delaysMeasured = [];
    let delaysAdjusted = [];
    let start;
    let now;
    const port = 10410;
    const app = express();
    let server;

    before(function (done) {
      app.get("/", function (req, res, next) {
        requests++;
        if (requests === 1) {
          start = new Date().valueOf();
        } else {
          now = new Date().valueOf();
          delaysMeasured.push(now - start);
        }
        if (requests > 5) {
          res.send("hello!");
        } else {
          res.sendStatus(401);
        }
      });

      server = app.listen(port, done);
    });

    afterEach(function () {
      requests = 0;
      delaysMeasured = [];
      delaysAdjusted = [];
    });

    it("retries using the specified delays", function (done) {
      delays = [100, 200, 300, 400, 500];

      agent
        .get("http://localhost:" + port)
        .retry(5, delays)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(6);
          delaysMeasured.length.should.equal(5);

          // Create a list of the actual delays measured between consecutive retries
          for (let i = 0; i < delaysMeasured.length; i++) {
            if (i === 0) {
              delaysAdjusted[i] = delaysMeasured[i];
            } else {
              delaysAdjusted[i] = delaysMeasured[i] - delaysMeasured[i - 1];
            }
          }

          // Assert that each delay measured is close to the specified delay
          for (let i = 0; i < delaysAdjusted.length; i++) {
            let delayDiff = delaysAdjusted[i] - delays[i];
            delayDiff.should.be.within(0, 20);
          }

          done(err);
        });
    });

    it("extrapolates the list of delays", function (done) {
      delays = [100, 200, 300];
      const expectedDelays = [100, 200, 300, 300, 300];

      agent
        .get("http://localhost:" + port)
        .retry(5, delays)
        .end(function (err, res) {
          res.text.should.eql("hello!");
          requests.should.eql(6);
          delaysMeasured.length.should.equal(5);

          // Create a list of the actual delays measured between consecutive retries
          for (let i = 0; i < delaysMeasured.length; i++) {
            if (i === 0) {
              delaysAdjusted[i] = delaysMeasured[i];
            } else {
              delaysAdjusted[i] = delaysMeasured[i] - delaysMeasured[i - 1];
            }
          }

          // Assert that each delay measured is close to the specified delay
          for (let i = 0; i < delaysAdjusted.length; i++) {
            let delayDiff = delaysAdjusted[i] - expectedDelays[i];
            delayDiff.should.be.within(0, 20);
          }

          done(err);
        });
    });

    after(function (done) {
      server.close(done);
    });
  });
});
