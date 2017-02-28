'use strict';
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(__dirname + '/public'));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});


app.get('/', function (req, res) {
  res.render('index');
});

const server = app.listen(PORT, function () {
  console.log('listen port ' + PORT + '\n');
});

const io = require('socket.io')(server);
io.set("origins","*:*");
// io.set('transports', [ 'websocket' ]);

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
    const room = '' + this.rooms.length;
    this.rooms.push(room);
    this.clients[room] = {active: UserStauts.master, end: false};
    this.steps[room] = [];
    return room;
  }

  addStep(room, step /* {user, position}*/) {
    this.steps[room] && this.steps[room].push(step);
  }

  createRoomSetMaster(id) {
    const room = this.createRoom();
    this.clients[room].master = id;
    return room;
  }

  getMaster(room) {
    return this.clients[room].master;
  }

  setSlave(room, id) {
    if (this.clients[room] && this.clients[room].slave == null) {
      this.clients[room].slave = id;
      return true;
    }
    return false
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
  console.log('connection', socket.id);

  socket.on('my_ping', (fn) => {
    fn();
    console.log('ping');
    socket.emit('pong');
  });

  socket.on('create', (fn) => {
    const room = clients.createRoomSetMaster(socket.id);
    console.log('connect', socket.id);
    fn({room});
  });

  socket.on('join', (data, fn) => {
    const {room} = data;
    if (!clients.setSlave(room, socket.id)) {
      return;
    }
    socket.join(room);
    fn({room});

    console.log('connect', socket.id);
    console.dir(clients);

    const curRoom = clients.getRoom(socket.id);
    io.to(curRoom.master).emit('start');
    io.to(curRoom.slave).emit('start');
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

io.on('error', (e) => {
  console.log(e);
});
setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

/*Promise.resolve()
  .then(() => db.open('db/db.sqlite3', {Promise}))
  .catch(err => console.error(err.stack))
  .finally(() => {
    server.listen(port);
    console.log('listen on port ' + port);
  });*/
