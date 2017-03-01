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

const UserStatus = {
  master: 'master',
  slave: 'slave',
};

const UserSteps = {
  master: 1,
  slave: 2,
};

const count = 20;

class Clients {
  constructor() {
    this.rooms = [];
    this.clients = {};
    this.steps = {};
  }

  static createField() {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(new Array(count));
    }
    return arr;
  }

  check(room, user) {
    const iRoom = this.clients[room];
    const userType = UserSteps[user];
    const {field} = iRoom;
    return this.checkWin(field, userType);
  }

  checkWin(field, user) {
    const height = field.length;
    const width = field[0].length;

    function check(x, y, dX, dY) {
      for (let _x = x + dX, _y = y + dY; ; _x += dX, _y +=dY) {
        if (field[_y][_x] != user) {
          return false;
        }
        if (_x >= x + 4 || _y >= y + 4) break;
      }
      return true;
    }

    var y, x;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (field[y][x] == user) {
          if (y + 4 < height && x + 4 < width) {
            // right diagonal
            if (check(x, y, 1, 1)) {
              return true;
            }
            if (x - 4 >= 0) {
              // left diagonal
              if (check(x, y, -1, 1)) {
                return true;
              }
            }
          }
          if (x + 4 < width) {
            // right
            if (check(x, y, 1, 0)) {
              return true;
            }
          }
          if (y + 4 < height) {
            // down
            if (check(x, y, 0, 1)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  createRoom() {
    const room = '' + this.rooms.length;
    this.rooms.push(room);
    this.clients[room] = {
      active: UserStatus.master,
      end: false,
      field: Clients.createField()
    };
    this.steps[room] = [];
    return room;
  }

  addStep(room, position, user) {
    const {field} = this.clients[room];
    const [x, y] = position.split(';');
    field[+y][+x] = UserSteps[user];
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
          status: UserStatus.master,
          room,
          master,
          slave,
        }
      }
      if (slave == id) {
        return {
          status: UserStatus.slave,
          room,
          master,
          slave,
        }
      }
    }
    return null;
  }

  toggleUser(room) {
    const active = this.clients[room].active == UserStatus.master ? UserStatus.slave : UserStatus.master;
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
      fn();
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

    clients.addStep(curRoom.room, data.position, curRoom.status);
    const isWin = clients.check(curRoom.room, curRoom.status);
    if (isWin) {
      console.log(`${socket.id} - ${curRoom.status} - win ************************`);
    }

    const nextUser = clients.toggleUser(curRoom.room);
    const active = nextUser.status;
    const waiting = nextUser.status == UserStatus.master ? UserStatus.slave : UserStatus.master;

    console.log(`[room ${curRoom.room}] {${socket.id}} /step position:${data.position}`);
    fn({status: 'ok'});

    io.to(curRoom[active]).emit('status', {
      status: isWin ? 'lose' : 'active',
      position: data.position,
    });
    io.to(curRoom[waiting]).emit('status', {
      status: isWin ? 'win' : 'waiting',
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
