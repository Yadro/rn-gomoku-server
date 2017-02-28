const io = require('socket.io-client');

const url = 'wss://gomokus.herokuapp.com';
// const url = 'ws://localhost:3000';

console.log('trying connect to ', url);

const steps = [];
class ServerApi {


  constructor(onChangeStatus) {
    this.socket = io.connect(url, {});
    this.onChangeStatus = onChangeStatus;

    this.socket.on('connect_error', function(){
      console.log('Connection Failed');
    });
    this.socket.on('connect', function(){
      console.log('Connected');
    });
    this.socket.on('disconnect', function () {
      console.log('Disconnected');
    });

    this.socket.on('time', (data) => {
      console.log('time');
      console.dir(data);
    });

    this.socket.on('joined', ({room}) => {
      console.log('joined', room);
    });

    this.socket.on('start', (data) => {
      console.log('start', data);
      console.log('step');
      this.socket.emit('step', {position: `${getRandom()};${getRandom()}`}, () => {});
    });

    this.socket.on('status', (data) => {
      if (data.status == 'active') {
        console.log('get position', data.position);
        steps.push(data.position);

        const position = `${getRandom()};${getRandom()}`;
        steps.push(position);

        console.log('step position', position);
        this.socket.emit('step', {position}, () => {})
      }
    });
  }

  create() {
    this.socket.emit('create', ({room}) => {
      this.room = room;
      console.log('create room ', room);
    });
  }
}

function getRandom() {
  return Math.floor(Math.random() * 20);
}

function onChangeStatus(data) {
  console.log(data);
}

const api = new ServerApi(onChangeStatus);
api.create();