'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var jsonscript = require('..');
var _ = require('lodash');


module.exports = function createApp(jsonscriptOptions) {
  var app = express();

  app.use(bodyParser.json());

  app.get('/api/:name/:id', function (req, res) {
    var id = req.params.id;
    send(res, req.params.name, id);
  });

  app.post('/api/:name', function (req, res) {
    var id = Date.now();
    send(res, req.params.name, id, req.body);
  });

  app.get('/api/:name/:id/error', function (req, res) {
    send(res.status(500), req.params.name, req.params.id);
  });

  jsonscriptOptions = jsonscriptOptions
                      ? _.extend({ basePath: '/api' }, jsonscriptOptions)
                      : { basePath: '/api' };
  app.post('/js', jsonscript(app, jsonscriptOptions));

  function send(res, name, id, data) {
    res.send({
      name: name,
      id: id,
      info: 'resource ' + name + ' id ' + id,
      data: data
    });
  }

  return app;
};
