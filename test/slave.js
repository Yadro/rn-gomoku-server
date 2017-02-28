const io = require('socket.io-client');


const url = 'wss://gomokus.herokuapp.com';
// const url = 'ws://localhost:3000';

console.log('trying connect to ', url);
const socket = io.connect(url);

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
});

const steps = [];
socket.on('status', (data) => {
  if (data.status == 'active') {
    console.log('get position', data.position);
    steps.push(data.position);

    const position = `${getRandom()};${getRandom()}`;
    console.log('step position', position);
    steps.push(position);
    socket.emit('step', {position}, () => {})
  }
});

function getRandom() {
  return Math.floor(Math.random() * 20);
}