'use strict';

var JSONScript = require('jsonscript-js');
var _ = require('lodash');
var processRequest = require('supertest');

module.exports = jsonscriptExpress;


var METHODS = ['get', 'post', 'put', 'delete'];
function jsonscriptExpress(app, options, js) {
  options = _.defaults(options, {
    routerExecutor: 'router',
    basePath: '',
    jsonscript: { strict: true },
    Promise: (typeof Promise !== 'undefined') && Promise
  });

  var processResponse = processResponseFunc(options);
  js = js || new JSONScript(options.jsonscript);
  addExecutorMethods();
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
        res.json(value);
      }, function (err) {
        res.status(err.errors ? 400 : err.statusCode || 500)
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
    .set('Accept', 'application/json');

    if (args.headers) request.set(args.headers);
    if (args.body) request.send(args.body);

    return new options.Promise(function (resolve, reject) {
      request.end(function (err, resp) {
        if (err) return reject(err);
        try { resolve(processResponse(resp, args)); }
        catch(e) { reject(e); }
      });
    });
  }


  function addExecutorMethods() {
    METHODS.forEach(function (method) {
      execRouter[method] = function(args) {
        if (args.method && args.method != method) {
          console.warn('method specified in args (' + args.method +
                        ') is different from $method in instruction (' + method + '), used ' + method);
        }
        args.method = method;
        return execRouter(args);
      };
    });
  }
}


function processResponseFunc(options) {
  return options.processResponse == 'body'
          ? bodyProcessResponse
          : typeof options.processResponse == 'function'
            ? options.processResponse
            : defaultProcessResponse;
}


function bodyProcessResponse(resp) {
  if (resp.statusCode < 300) return resp.body;
  throw new HttpError(resp);
}


function defaultProcessResponse(resp, args) {
  resp = _.pick(resp, 'statusCode', 'headers', 'body');
  resp.request = args;
  return resp;
}


function HttpError(resp) {
  this.message = resp.body ? JSON.stringify(resp.body) : 'Error';
  this.statusCode = resp.statusCode;
}

HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.constructor = HttpError;
