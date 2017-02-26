const express = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const db = require('sqlite');
const morgan = require('morgan');

const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3001;

io.on('connection', function(client){
  client.on('event', function(data){
    console.log('event', data);

  });

  client.on('disconnect', function(){
    console.log('disconnect');
  });
});

/*
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(morgan('dev'));
app.use(bodyParser.json());

app.post('/create', async (req, res, next) => {
  try {
    const {lastID} = await db.run('INSERT INTO `sessions` (value) VALUES (0)');
    res.json({
      session: lastID
    });
  } catch (err) {
    next(err);
  }
});

app.get('/step/:session', async (req, res, next) => {
  try {
    const {session} = req.params;
    const steps = await db.all('SELECT * FROM steps WHERE session = ?', session);
    res.json({
      steps
    });
  } catch (err) {
    next(err);
  }
});

app.get('/current_user/:session', async (req, res, next) => {
  try {
    const {session} = req.params;
    const result = await db.all('SELECT * FROM `sessions` WHERE id = ?', session);
    console.log(result);
    res.json({
      user: result[0].value,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/step', async (req, res, next) => {
  try {
    const {user, session, position} = req.body;
    let currentUser = -1;
    await Promise.all([
      db.run('INSERT INTO steps (user, session, position) VALUES (?, ?, ?)',
        user, session, position
      ),
      db.all('SELECT * FROM `sessions` WHERE id = ?', session).then(result => {
        currentUser = result[0].value == 1 ? 0 : 1;
        return db.run('UPDATE `sessions` SET value = ? WHERE id = ?', currentUser, session);
      })
    ]);
    res.json({
      status: 'ok',
      user: currentUser
    });
  } catch (err) {
    next(err);
  }
});
*/

Promise.resolve()
// First, try connect to the database
  .then(() => db.open('db/db.sqlite3', {Promise}))
  .catch(err => console.error(err.stack))
  // Finally, launch Node.js app
  .finally(() => app.listen(port));
