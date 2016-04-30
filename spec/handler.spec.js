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
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
        script: {
          $exec: 'router',
          $args: {
            method: 'get',
            path: '/object/1'
          }
        }
      })
      .expect(200)
      .end(function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process POST', function (done) {
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
        script: {
          $exec: 'router',
          $args: {
            method: 'post',
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      })
      .expect(200)
      .end(function (err, resp) {
        assertPostResult(resp.body, 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('single instruction with $method', function() {
    it('should process GET', function (done) {
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
        script: {
          $exec: 'router',
          $method: 'get',
          $args: {
            path: '/object/1'
          }
        }
      })
      .expect(200)
      .end(function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process GET even if method in $args is different', function (done) {
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
        script: {
          $exec: 'router',
          $method: 'get',
          $args: {
            method: 'post',
            path: '/object/1'
          }
        }
      })
      .expect(200)
      .end(function (err, resp) {
        assertGetResult(resp.body, 'object', '1');
        done();
      });
    });

    it('should process POST', function (done) {
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
        script: {
          $exec: 'router',
          $method: 'post',
          $args: {
            path: '/object',
            body: { foo: 'bar' }
          }
        }
      })
      .expect(200)
      .end(function (err, resp) {
        assertPostResult(resp.body, 'object', { foo: 'bar' });
        done();
      });
    });
  });

  describe('parallel evaluation', function() {
    it('should process GETs', function (done) {
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
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
      })
      .expect(200)
      .end(function (err, resp) {
        assertGetResult(resp.body.obj1, 'object', '1');
        assertGetResult(resp.body.obj2, 'object', '2');
        done();
      });
    });
  });

  describe('sequential evaluation', function() {
    it('should process GET and then POST', function (done) {
      test(app)
      .post('/js')
      .set('Accept', 'application/json')
      .send({
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
      })
      .expect(200)
      .end(function (err, resp) {
        assertGetResult(resp.body[0], 'object', '1');
        assertPostResult(resp.body[1], 'object', { foo: 'bar' });
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
        test(app)
        .post('/js')
        .set('Accept', 'application/json')
        .send({
          script: {
            $exec: 'router',
            $args: {
              method: 'get',
              path: '/object/1'
            }
          }
        })
        .expect(200)
        .end(function (err, resp) {
          assert.deepEqual(resp.body, { name: 'object', id: 1, info: 'resource object id 1' });
          done();
        });
      });
    });
  });
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
