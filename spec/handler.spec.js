'use strict';

var test = require('supertest');
var createApp = require('./app');
var assert = require('assert');


describe('jsonscript handler', function() {
  var app;

  beforeEach(function() {
    app = createApp();
  });


  describe('single instruction without $method', function() {
    it('should process GET', function (done) {
      send({
        script: {
          $exec: 'router',
          $args: {
            method: 'get',
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process GET with macro', function (done) {
      send({
        script: {
          $$router: {
            method: 'get',
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process POST', function (done) {
      send({
        script: {
          $exec: 'router',
          $args: {
            method: 'post',
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'object', { foo: 'bar' });
        done();
      });
    });

    it('should process POST with macro', function (done) {
      send({
        script: {
          $$router: {
            method: 'post',
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('single instruction with $method', function() {
    it('should process GET', function (done) {
      send({
        script: {
          $exec: 'router',
          $method: 'get',
          $args: {
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process GET with macro', function (done) {
      send({
        script: {
          '$$router.get': { path: '/object/1' }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process GET even if method in $args is different', function (done) {
      send({
        script: {
          $exec: 'router',
          $method: 'get',
          $args: {
            method: 'post',
            path: '/object/1'
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process POST', function (done) {
      send({
        script: {
          $exec: 'router',
          $method: 'post',
          $args: {
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'object', { foo: 'bar' });
        done();
      });
    });

    it('should process POST with macro', function (done) {
      send({
        script: {
          '$$router.post': {
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      }, function (err, resp) {
        assertPostResult(resp.body, 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('parallel evaluation', function() {
    it('should process GETs', function (done) {
      send({
        script: {
          obj1: {
            $exec: 'router',
            $method: 'get',
            $args: {
              path: '/object/1'
            }
          },
          obj2: {
            $exec: 'router',
            $method: 'get',
            $args: {
              path: '/object/2'
            }
          }
        }
      }, function (err, resp) {
        assertGetResult(resp.body.obj1, 'object', '1');
        assertGetResult(resp.body.obj2, 'object', '2');
        done();
      });
    });

    it('should process GETs with macros', function (done) {
      send({
        script: {
          obj1: { '$$router.get': { path: '/object/1' } },
          obj2: { '$$router.get': { path: '/object/2' } }
        }
      }, function (err, resp) {
        assertGetResult(resp.body.obj1, 'object', '1');
        assertGetResult(resp.body.obj2, 'object', '2');
        done();
      });
    });
  });

  describe('error handling', function() {
    it('should return error if script is invalid', function (done) {
      send({
        script: {
          $exec: 'router',
          $args: {
            method: 'get',
            path: '/object/1'
          },
          $wrongProperty: true
        }
      }, function (err, resp) {
        assert.equal(err.message, 'expected 200 "OK", got 400 "Bad Request"');
        assert.equal(resp.statusCode, 400);
        assert.equal(resp.body.error, 'script is invalid');
        done();
      });
    });
  });

  describe('sequential evaluation', function() {
    it('should process GET and then POST', function (done) {
      send({
        script: [
          {
            $exec: 'router',
            $method: 'get',
            $args: {
              path: '/object/1'
            }
          },
          {
            $exec: 'router',
            $method: 'post',
            $args: {
              path: '/object',
              body: { foo: 'bar' }
            }
          }
        ]
      }, function (err, resp) {
        assertGetResult(resp.body[0], 'object', '1');
        assertPostResult(resp.body[1], 'object', { foo: 'bar' });
        done();
      });
    });

    it('should process GET and then POST with macros', function (done) {
      send({
        script: [
          { '$$router.get': { path: '/object/1' } },
          { '$$router.post': { path: '/object', body: { foo: 'bar' } } }
        ]
      }, function (err, resp) {
        assertGetResult(resp.body[0], 'object', '1');
        assertPostResult(resp.body[1], 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('calculations', function() {
    it('addition with macro', function (done) {
      send({
        script: { '$+': [1, 2, 3] }
      }, function (err, resp) {
        assert(!err);
        assert.strictEqual(resp.body, 6);
        done();
      });
    });
  });

  describe('array', function() {
    it('array filter with macro', function (done) {
      send({
        script: {
          '$$array.filter': {
            data: [-2, -1, 0, 1, 2, 3],
            iterator: {
              $func: { '$>': [ {$data: '/num'}, 0 ] },
              $args: ['num']
            }
          }
        }
      }, function (err, resp) {
        assert(!err);
        assert.deepStrictEqual(resp.body, [1, 2, 3]);
        done();
      });
    });
  });

  describe('options', function() {
    describe('processResponse: "body"', function() {
      beforeEach(function() {
        app = createApp({ processResponse: 'body' });
      });

      it('should return response body only', function (done) {
        send({
          script: {
            $exec: 'router',
            $args: {
              method: 'get',
              path: '/object/1'
            }
          }
        }, function (err, resp) {
          assert.deepEqual(resp.body, { name: 'object', id: 1, info: 'resource object id 1' });
          done();
        });
      });

      it('should return error if statusCode is >= 300', function (done) {
        send({
          script: {
            '$$router.get': { path: '/object/1/error' }
          }
        }, function (err, resp) {
          assert.equal(err.message, 'expected 200 "OK", got 500 "Internal Server Error"');
          assert.deepEqual(JSON.parse(resp.body.error), {
            name: 'object',
            id: 1,
            info: 'resource object id 1'
          });
          done();
        });
      });
    });
  });

  function send(reqBody, callback) {
    test(app)
    .post('/js')
    .set('Accept', 'application/json')
    .send(reqBody)
    .expect(200)
    .end(callback);
  }
});


function assertGetResult(result, name, id) {
  assert.equal(result.statusCode, 200);
  assert.equal(typeof result.headers, 'object');
  assert.deepEqual(result.request, { method: 'get', path: '/' + name + '/' + id })
  assert.deepEqual(result.body, { name: name, id: id, info: 'resource ' + name + ' id ' + id });
}


function assertPostResult(result, name, data) {
  assert.equal(result.statusCode, 200);
  assert.equal(typeof result.headers, 'object');
  assert.deepEqual(result.request, { method: 'post', path: '/' + name, body: data })
  assert.equal(result.body.name, name);
  var id = result.body.id;
  assert(Date.now() - id < 1000);
  assert.equal(result.body.info, 'resource ' + name + ' id ' + id);
  assert.deepEqual(result.body.data, data);
}
