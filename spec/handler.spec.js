'use strict';

var test = require('supertest');
var app = require('./app');
var assert = require('assert');


describe('jsonscript handler', function() {
  describe('single instruction', function() {
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
        var result = resp.body;
        assert.equal(result.statusCode, 200);
        assert.equal(typeof result.headers, 'object');
        assert.deepEqual(result.request, { method: 'get', path: '/object/1' })
        assert.deepEqual(result.body, { name: 'object', id: '1', info: 'resource object id 1' });
        done();
      });
    });
  });
});
