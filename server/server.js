const path = require('path');
const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server, { wsEngine: 'ws' });

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    
});

server.listen(3000, () => {
    console.log('Server is up on port 3000')
})