# jsonscript-express

Express middleware for batch processing using [JSONScript](https://github.com/JSONScript/jsonscript).

[![Build Status](https://travis-ci.org/JSONScript/jsonscript-express.svg?branch=master)](https://travis-ci.org/JSONScript/jsonscript-express)
[![npm version](https://badge.fury.io/js/jsonscript-express.svg)](https://www.npmjs.com/package/jsonscript-express)
[![Code Climate](https://codeclimate.com/github/JSONScript/jsonscript-express/badges/gpa.svg)](https://codeclimate.com/github/JSONScript/jsonscript-express)
[![Coverage Status](https://coveralls.io/repos/github/JSONScript/jsonscript-express/badge.svg?branch=master)](https://coveralls.io/github/JSONScript/jsonscript-express?branch=master)


## Install

```
npm install jsonscript-express
```

## Getting started

Sample express app:

```JavaScript
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonscript = require('jsonscript-express');

// app needs body parser for JSON even if no endpoint uses it.
// it is needed for JSONScript middleware
app.use(bodyParser.json());

app.get('/api/resource/:id', function (req, res) {
  // ...
  res.send(data);
});

app.post('/api/resource', function (req, res) {
  // ...
  res.send(result);
});

/**
 * The line below adds JSONScript interpreter on the endpoint '/js'
 * that allows processing any scripts combining existing enpoints
 */
app.post('/js', jsonscript(app, { basePath: '/api' }));

app.listen(3000);
```

Now you can send POST requests to `/js` endpoint with the body containing the script and an optional data instance that will be processed by JSONScript interpreter. For example, with this request:

```javascript
{
  "script": {
    "res1": {
      "$exec": "router", // executor name can be changed in options
      "$method": "get",  // $method can be get/post/put/delete
      "$args": { "path": "/resource/1" }
      // method property in $args can be used instead of $method
    },
    "res2": {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/2" }
    }
  }
}
```

the response will be a combination of two responses (both requests are processed in parallel):

```javascript
{
  "res1": {
    "statusCode": 200,
    "headers": { /* response headers for the 1st request */ },
    "request": { "method": "get", "path": "/resource/1" },
    "body": { /* response body 1 */ }
  },
  "res2": {
    "statusCode": 200,
    "headers": { /* response headers for the 2nd request */ },
    "request": { "method": "get", "path": "/resource/2" },
    "body": { /* response body 2 */ }
  }
}
```

If option `processResponse: "body"` were used the result would have been:

```javascript
{
  "res1": { /* response body 1 */ },
  "res2": { /* response body 2 */ }
}
```

JSONScript also supports sequential evaluation, conditionals, data manipulation etc. So you can implement an advanced logic in your script and it will be executed in the server without sending responses of individual requests to the client.

See [JSONScript Language](https://github.com/JSONScript/jsonscript/blob/master/LANGUAGE.md) for more information.


## API

##### jsonscript(Express app [, Object options]) -&gt; Function

Create express route handling function to process JSONScript. Both the `script` and the `data` instance should be properties of the request body:

```javascript
{
  "script": {
    // JSONScript, can be an array
  },
  "data": {
    // data instance that can be used from the script,
    // can be array
  }
}
```

## Options

Defaults:

```javascript
{
  routerExecutor: 'router',
  basePath: '',
  processResponse: undefined,
  jsonscript: { strict: true },
  Promise: undefined
}
```

- _routerExecutor_: the name of the executor (the value of "$exec" keyword in the instruction) used to access Express router, `"router"` is used by default.
- _basePath_: the path used as a prefix to paths in the script $exec instruction arguments.
- _processResponse_: possible values:
  - `"body"` - return only response body if status code is < 300, throw an exception otherwise.
  - function - custom function to process the response object, can throw an exception or return the object to be used as the result.
- _jsonscript_: options passed to JSONScript interpreter [jsonscript-js](https://github.com/JSONScript/jsonscript-js).
- _Promise_: an optional Promise class, the native Promise is used by default.


## License

[MIT](https://github.com/JSONScript/jsonscript-express/blob/master/LICENSE)
