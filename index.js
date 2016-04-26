'use strict';

var JSONScript = require('jsonscript-js');
var _ = require('lodash');
var processRequest = require('supertest');

module.exports = jsonscriptExpress;


function jsonscriptExpress(app, options) {
  options = _.defaults(options, {
    routerExecutor: 'router',
    // endpoint: 'jsonscript',
    basePath: '',
    jsonscript: { strict: true }
  });
  var js = JSONScript(options.jsonscript);
  js.addExecutor(options.routerExecutor, execRouter);
  evaluator.js = js;

  return evaluator;


  function evaluator(req, res) {
    var script = req.body.script;
    var data = req.body.data;
    var valid = js.validate(script);
    if (valid) {
      js.evaluate(script, data)
      .then(function (value) {
        res.send(value);
      }, function (err) {
        res.status(err.errors ? 400 : 500)
        .send({
          error: err.message,
          errors: err.errors
        });
      });
    } else {
      res.status(400)
      .send({
        error: 'script is invalid',
        errors: js.validate.errors
      });
    }
  }


  function execRouter(args) {
    var request = processRequest(app)[args.method](options.basePath + args.path)
    .set('Accept', 'application/json')

    if (args.headers) request.set(args.headers);
    if (args.body) request.send(args.body);

    return new Promise(function (resolve, reject) {
      request.end(function (err, resp) {
        if (err) return reject(err);
        resp = _.pick(resp, 'statusCode', 'headers', 'body');
        resp.request = args;
        resolve(resp);
      });
    });
  }
};
