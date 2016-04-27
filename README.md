# jsonscript-express

Express middleware for batch processing using [JSONScript](https://github.com/JSONScript/jsonscript).


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

```json
{
  "script": {
    "res1": {
      "$exec": "router",
      "$method": "get",
      "$args": { "path": "/resource/1" }
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

JSONScript also supports sequential evaluation, conditionals, data manipulation etc. So you can implement an advanced logic in your script and it will be executed in the server without sending responses of individual requests to the client.

See [JSONScript Language](https://github.com/JSONScript/jsonscript/blob/master/LANGUAGE.md) for more information.


## License

[MIT](https://github.com/JSONScript/jsonscript-express/blob/master/LICENSE)
