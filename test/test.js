const io = require('socket.io-client');
const socket = io.connect('ws://localhost:3000');

socket.emit('event', { my: 'data' });

socket.on('response', function (data) {
  console.log(data);
});