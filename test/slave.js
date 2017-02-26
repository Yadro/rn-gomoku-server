const io = require('socket.io-client');
const socket = io.connect('ws://localhost:3000');

const room = process.argv[2];
console.dir(room);
console.dir(process.argv);

socket.emit('join', {room}, () => {
  console.log('join');
});

socket.on('joined', () => {
  console.log('joined');
});

socket.on('start', (data) => {
  console.log('start', data);
  socket.emit('step', {
    user: 'slave',
    position: '0;1'
  });
});

socket.on('status', (data) => {
  console.log('status');
});