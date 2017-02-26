const Promise = require('bluebird');
const db = require('sqlite');
const io = require('socket.io')();
const port = 3000;

io.on('error', (e) => {
  console.log(e);
});

class Clients {
  constructor() {
    this.rooms = [];
    this.clients = {};
  }

  createRoom() {
    const room = this.rooms.length;
    this.clients[room] = {active: 'master'};
    return room;
  }

  setMaster(room, id) {
    this.clients[room].master = id;
  }

  getMaster(room) {
    return this.clients[room].master;
  }

  setSlave(room, id) {
    this.clients[room].slave = id;
  }

  getSlave(room) {
    return this.clients[room].slave;
  }

  getRoom(id) {
    const {clients} = this;
    for (let room in clients) {
      const {master, slave} = clients[room];
      if (master == id) {
        return {
          status: 'master',
          room,
          master,
          slave,
        }
      }
      if (slave == id) {
        return {
          status: 'slave',
          room,
          master,
          slave,
        }
      }
    }
    return null;
  }

  toggleUser(room) {
    const active = this.clients[room].active == 'master' ? 'slave' : 'master';
    this.clients[room].active = active;
    return {
      id: this.clients[room][active],
      status: active
    };
  }
}

const clients = new Clients();
const rooms = [];

io.on('connection', (socket) => {

  socket.on('create', () => {
    const room = clients.createRoom();
    clients.setMaster(room, socket.id);
    console.log('create room', room);
    socket.join(room).emit('joined', {room});
  });

  socket.on('join', (data) => {
    console.log(data);
    const {room} = data;
    clients.setSlave(room, socket.id);
    console.log(clients.clients[room]);

    socket.join(room);
    io.in(room).emit('start');
  });

  socket.on('step', (data) => {
    const curRoom = clients.getRoom(socket.id);
    console.log(curRoom);

    const user = clients.toggleUser(curRoom.room);
    console.log(`/step room ${curRoom.room} {${user.id}/${user.status}} data:${data}`);

    io.to(curRoom.master).emit('status');
    io.to(curRoom.slave).emit('status');
  });

  socket.on('disconnect', function(){
    console.log('disconnect');
  });
});

Promise.resolve()
  .then(() => db.open('db/db.sqlite3', {Promise}))
  .catch(err => console.error(err.stack))
  .finally(() => {
    io.listen(port);
    console.log('listen on port ' + port);
  });
