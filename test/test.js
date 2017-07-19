const express = require('express')

const agent = require('superagent');
require('../')(agent);

const should = require('should')
const assert = require('assert')
const http = require('http')

http.globalAgent.maxSockets = 2000

describe('superagent-retry-delay', function () {

  describe('not-errors', function () {
    let requests = 0
    const port = 10410
    const app = express()
    let server

    before(function (done) {

      app.get('/', function (req, res, next) {
        requests++
        res.send('hello!')
      })

      server = app.listen(port, done)
    })

    it('should not retry on success', function (done) {
      agent
        .get('http://localhost:' + port)
        .retry(5, 17)
        .end(function (err, res) {
          res.text.should.eql('hello!')
          requests.should.eql(1)

          done(err)
        })
    })

    after(function (done) { server.close(done) })
  })

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
          res.sendStatus(503)
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
        requests++
        if (requests > 4) {
          res.send('hello!')
        } else {
          res.sendStatus(500)
        }
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
          res.sendStatus(404)
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
          res.sendStatus(401)
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
})
