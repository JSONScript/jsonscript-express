'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonscript = require('..');


app.use(bodyParser.json());

app.get('/api/:name/:id', function (req, res) {
  var id = req.params.id;
  send(res, req.params.name, id);
});

app.post('/api/:name', function (req, res) {
  var id = Date.now();
  send(res, req.params.name, id, req.body);
});

app.post('/js', jsonscript(app, { basePath: '/api' }));

function send(res, name, id, data) {
  res.send({
    name: name,
    id: id,
    info: 'resource ' + name + ' id ' + id,
    data: data
  });
}


if (!module.parent) app.listen(3000);

module.exports = app;
