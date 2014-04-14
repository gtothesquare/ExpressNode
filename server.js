var express = require('express'),
  http = require('http'),
  app = express(),
  routes = require('./routes'),//needs a index.js in it
  port    = parseInt(process.env.PORT, 10) || 3000,
  server = app.listen(port),
  io = require('socket.io').listen(server);


/**
 * socket io configuration
 */
io.configure('production', function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging

  // enable all transports
  io.set('transports', [
    'websocket' ,
    'flashsocket',
    'htmlfile',
    'xhr-polling',
    'jsonp-polling'
  ]);

});

io.configure('development', function(){
  io.set('transports', ['websocket']);
});

io.sockets.on('connection', function (socket) {

  socket.on('fromClient', function (data){
    // make some request to some json api
    var req = http.get("jsonapi", function(res) {

      var result = "";

      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        // reading response
        result += chunk;
      }).on('end', function(){
        // send back to cliet
        // socket.emit('replyClient', {result : result});
      });
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });

    // always good to end the request.
    req.end();
  });

  socket.on('disconnect', function () {
    // disconnect called
    io.sockets.emit('user disconnected');
  });
});


//generic error logging
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

//error-handler for requests made via XHR
function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'sorry, something went wrong!' });
  } else {
    next(err);
  }
}

//"catch-all" implementation when there is a server error not from XHR request
function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}

app.configure(function(){
  // is now a development only middleware
  //https://github.com/senchalabs/connect/commit/a68b1c9b4389801c4c58c07fc91b65b19687d91c#lib/middleware/errorHandler.js
  app.use(express.errorHandler());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
  app.enable('trust proxy');
  app.use(logErrors);
  app.use(clientErrorHandler);
  app.use(errorHandler);
});

app.configure('development', function() {
  app.use(express.logger());
});

app.get('/', routes.index);

console.log("Express server listening on port: " + port);