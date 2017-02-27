const io = require('socket.io-client');

const url = 'https://gomokus.herokuapp.com:3000';
console.log('trying connect to ', url);

const steps = [];
class ServerApi {


  constructor(onChangeStatus) {
    this.socket = io.connect(url);
    this.onChangeStatus = onChangeStatus;

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