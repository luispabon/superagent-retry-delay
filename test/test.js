const express = require('express')
const agent = require('superagent')
const should = require('should')
const assert = require('assert')
const http = require('http')

http.globalAgent.maxSockets = 2000

require('../src/index')(agent)

describe('superagent-retry-delay', function () {

  describe('errors', function () {
    let requests = 0
    const port = 10410
    const app = express()
    let server

    before(function (done) {

      app.get('/', function (req, res, next) {
        requests++
        if (requests > 4) {
          res.send('hello!')
        } else {
          res.send(503)
        }
      })

      server = app.listen(port, done)
    })

    it('should retry on errors', function (done) {

      agent
        .get('http://localhost:' + port)
        .end(function (err, res) {
          res.status.should.eql(503)
        })

      agent
        .get('http://localhost:' + port)
        .retry(5, 17)
        .end(function (err, res) {
          res.text.should.eql('hello!')
          done(err)
        })
    })

    after(function (done) { server.close(done) })
  })

  describe('500 errors', function () {
    let requests = 0
    const port = 10410
    const app = express()
    let server

    before(function (done) {
      app.get('/', function (req, res, next) {
        // console.log(requests)
        requests++
        if (requests > 4) {
          res.send('hello!')
        } else {
          res.send(500)
        }




        // if (requests < 4) res.send(500)
        // else res.send('hello!')
      })

      server = app.listen(port, done)
    })

    it('should retry on errors', function (done) {

      agent
        .get('http://localhost:' + port)
        .end(function (err, res) {
          res.status.should.eql(500)
        })

        agent
          .get('http://localhost:' + port)
          .retry(5, 13)
          .end(function (err, res) {
            res.text.should.eql('hello!')
            requests.should.eql(5)
            done(err)
          })
    })

    after(function (done) { server.close(done) })
  })

  describe('404 errors', function () {
    let requests = 0
    const port = 10410
    const app = express()
    let server

    before(function (done) {
      app.get('/', function (req, res, next) {

        requests++
        if (requests > 4) {
          res.send('hello!')
        } else {
          res.send(404)
        }
      })

      server = app.listen(port, done)
    })

    it('should retry on errors', function (done) {

      agent
        .get('http://localhost:' + port)
        .end(function (err, res) {
          res.status.should.eql(404)
        })

      agent
        .get('http://localhost:' + port)
        .retry(5, 13)
        .end(function (err, res) {
          res.text.should.eql('hello!')
          requests.should.eql(5)
          done(err)
        })
    })

    after(function (done) { server.close(done) })
  })

  describe('401 errors', function () {
    let requests = 0
    const port = 10410
    const app = express()
    let server

    before(function (done) {
      app.get('/', function (req, res, next) {

        requests++
        if (requests > 4) {
          res.send('hello!')
        } else {
          res.send(401)
        }
      })

      server = app.listen(port, done)
    })

    it('should retry on errors', function (done) {

      agent
        .get('http://localhost:' + port)
        .end(function (err, res) {
          res.status.should.eql(401)
        })

      agent
        .get('http://localhost:' + port)
        .retry(5, 13)
        .end(function (err, res) {
          res.text.should.eql('hello!')
          requests.should.eql(5)
          done(err)
        })
    })

    after(function (done) { server.close(done) })
  })

  describe('resets', function () {
    let requests = 0
    const port = 10410
    const app = express()
    let server

    before(function (done) {
      server = app.listen(port, done)
    })

    it('should retry client timeouts', function (done) {
      app.get('/client-timeouts', function (req, res, next) {
        requests++
        if (requests > 10) res.send('hello!')
      })

      const url = 'http://localhost:' + port + '/client-timeouts'

      agent
        .get(url)
        .timeout(10)
        .end(function (err, res) {
          should.exist(err)
        })

      agent
        .get(url)
        .timeout(2)
        .retry(20, 10)
        .end(function (err, res) {
          res.text.should.eql('hello!')
          done()
        })
    })

    it('should retry with the same headers', function (done) {
      const url = 'http://localhost:' + port + '/headers'
      let requests = 0

      app.get('/headers', function (req, res) {
        if (++requests > 3) return res.send(req.headers)
      })

      agent
        .get(url)
        .set('Accept', 'application/json')
        .set('X-Foo', 'baz')
        .timeout(10)
        .retry(4, 10)
        .end(function (err, res) {
          assert('baz' == res.body['x-foo'])
          assert('application/json' == res.body['accept'])
          done()
        })
    })

    it('should re-send data and headers correctly', function (done) {
      const url = 'http://localhost:' + port + '/data'
      let requests = 0

      app.post('/data', express.bodyParser(), function (req, res) {
        if (++requests < 3) return
        res.send({ body: req.body, headers: req.headers })
      })

      agent
        .post(url)
        .type('json')
        .send({ data: 1 })
        .timeout(10)
        .retry(4, 10)
        .end(function (err, res) {
          assert(1 == res.body.body.data)
          assert('application/json' == res.body.headers['content-type'])
          done()
        })
    })

    it('should retry on server resets', function (done) {
      let requests = 0

      app.get('/server-timeouts', function (req, res, next) {
        requests++
        if (requests > 10) return res.send('hello!')
        res.setTimeout(1)
      })

      const url = 'http://localhost:' + port + '/server-timeouts'

      agent
        .get(url)
        .end(function (err, res) {
          err.code.should.eql('ECONNRESET')
        })

      agent
        .get(url)
        .retry(20, 10)
        .end(function (err, res) {
          res.text.should.eql('hello!')
          done()
        })
    })

    it('should retry on server connection refused', function (done) {
      const url = 'http://localhost:' + (port + 1) + '/hello'
      const request = agent.get(url)
      const allowedRetries = 10
      const allowedTries = allowedRetries + 1
      let triesCount = 0

      const oldEnd = request.end
      request.end = function (fn) {
        triesCount++
        oldEnd.call(request, fn)
      }

      request
        .retry(allowedRetries)
        .end(function (err, res) {
          err.code.should.eql('ECONNREFUSED')
          triesCount.should.eql(allowedTries)
          done()
        })
    })

    it('should retry with the same querystring', function (done) {
      let requests = 0

      app.get('/qs-data', function (req, res) {
        if (++requests > 10) return res.json({ foo: req.query.foo })
        res.setTimeout(1)
      })

      const url = 'http://localhost:' + port + '/qs-data'

      agent
        .get(url)
        .retry(20, 10)
        .query({ foo: 'bar' })
        .end(function (err, res) {
          res.body.foo.should.eql('bar')
          done()
        })
    })
  })
})
