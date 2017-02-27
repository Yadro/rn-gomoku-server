const Promise = require('bluebird');
const db = require('sqlite');
const io = require('socket.io')();
const port = 3000;

io.on('error', (e) => {
  console.log(e);
});

const UserStauts = {
  master: 'master',
  slave: 'slave',
};

class Clients {
  constructor() {
    this.rooms = [];
    this.clients = {};
    this.steps = {};
  }

  createRoom() {
    const room = this.rooms.length;
    this.clients[room] = {active: UserStauts.master};
    this.steps[room] = [];
    return room;
  }

  addStep(room, step /* {user, position}*/) {
    this.steps[room] && this.steps[room].push(step);
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
          status: UserStauts.master,
          room,
          master,
          slave,
        }
      }
      if (slave == id) {
        return {
          status: UserStauts.slave,
          room,
          master,
          slave,
        }
      }
    }
    return null;
  }

  toggleUser(room) {
    const active = this.clients[room].active == UserStauts.master ? UserStauts.slave : UserStauts.master;
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

  socket.on('my_ping', (fn) => {
    fn();
    console.log('ping');
    socket.emit('pong');
  });

  socket.on('create', (fn) => {
    const room = clients.createRoom();
    clients.setMaster(room, socket.id);
    console.log('connect', socket.id);
    fn({room});
  });

  socket.on('join', (data) => {
    const {room} = data;
    if (!room) return;

    console.log('connect', socket.id);
    clients.setSlave(room, socket.id);
    socket.join(room);
    io.in(room).emit('start');
  });

  socket.on('step', (data, fn) => {
    const curRoom = clients.getRoom(socket.id);
    if (!curRoom) return;

    const nextUser = clients.toggleUser(curRoom.room);
    const active = nextUser.status;
    const waiting = nextUser.status == UserStauts.master ? UserStauts.slave : UserStauts.master;

    console.log(`[room ${curRoom.room}] {${socket.id}} /step position:${data.position}`);
    fn({status: 'ok'});

    io.to(curRoom[active]).emit('status', {
      status: 'active',
      position: data.position,
    });
    io.to(curRoom[waiting]).emit('status', {
      status: 'waiting',
    });
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
