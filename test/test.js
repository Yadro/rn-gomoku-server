const io = require('socket.io-client');

const url = 'ws://localhost:3000';

class ServerApi {

  constructor(onChangeStatus) {
    this.socket = io.connect(url);
    this.onChangeStatus = onChangeStatus;

    this.socket.on('joined', ({room}) => {
      console.log('joined', room);
    });

    this.socket.on('start', (data) => {
      console.log('start', data);
      this.socket.emit('step', {
        user: 'master',
        position: '0;1'
      });
    });

    this.socket.on('status', (data) => {
      this.onChangeStatus(data);
    });
  }

  create() {
    this.socket.emit('create', ({room}) => {
      this.room = room;
    });
  }
}


function onChangeStatus(data) {
  console.log(data);
}

const api = new ServerApi(onChangeStatus);
api.create();