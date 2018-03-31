const path = require('path');
const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const log = require('./lib/log')(module);
const config = require('./config');
var HttpError = require('./error/error').HttpError;

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server, { wsEngine: 'ws' });


app.use(require('./middleware/sendHttpError'));
require('./routes')(app);

app.use(express.static(publicPath));
app.use(function(err, req, res, next) {
    if (typeof err == 'number') { // next(404);
      err = new HttpError(err);
    }
    res.sendHttpError(err);
    /* if (err instanceof HttpError) {
      res.sendHttpError(err);
    } else {
      if (app.get('env') == 'development') {
        express.errorHandler()(err, req, res, next);
      } else {
        log.error(err);
        err = new HttpError(500);
        res.sendHttpError(err);
      }
    } */
  });


  io.on('connection', (socket) => {
    log.info('user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
    
    socket.on('disconnect', () => {
        log.info('user disconnected');
    });

    
});

server.listen(config.get('port'), () => {
    log.info('Server is up on port' + config.get('port'))
})