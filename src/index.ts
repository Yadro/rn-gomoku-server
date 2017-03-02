'use strict';
const express = require('express');
const path = require('path');
import {Clients, UserStatus, UserSteps} from './clients';

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


const clients = new Clients();

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
