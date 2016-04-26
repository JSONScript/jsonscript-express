'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonscript = require('..');


app.use(bodyParser.json());

app.get('/api/:name/:id', function (req, res) {
  var name = req.params.name;
  var id = req.params.id;
  send(res, name, id);
});

app.post('/api/:name', function (req, res) {
  var name = req.params.name;
  var id = Date.now();
  send(res, name, id);
});

app.post('/js', jsonscript(app, { basePath: '/api' }));

function send(res, name, id) {
  res.send({
    name: name,
    id: id,
    info: 'resource ' + name + ' id ' + id
  });
}


if (!module.parent) app.listen(3000);

module.exports = app;
