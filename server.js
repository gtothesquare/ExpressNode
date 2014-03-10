var express = require('express'),
  http = require('http'),
  app = express(),
  routes = require('./routes'),//needs a index.js in it
  port    = parseInt(process.env.PORT, 10) || 3000,
  server = app.listen(port),
  io = require('socket.io').listen(server);

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
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
  app.use(logErrors);
  app.use(clientErrorHandler);
  app.use(errorHandler);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

console.log("Express server listening on port: " + port);