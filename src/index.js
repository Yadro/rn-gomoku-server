const express = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const db = require('sqlite');

const app = express();
const port = process.env.PORT || 3001;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

app.get('/step', async (req, res, next) => {
  try {
    const {session} = req.body;
    const steps = await db.all('SELECT * FROM steps WHERE session = ?', session);
    res.json({
      steps
    });
  } catch (err) {
    next(err);
  }
});

app.post('/step', async (req, res, next) => {
  try {
    const {user, session, position} = req.body;
    await db.run('INSERT INTO steps (user, session, position) VALUES (?, ?, ?)',
      user, session, position
    );
    res.json({
      status: 'ok'
    });
  } catch (err) {
    next(err);
  }
});


Promise.resolve()
// First, try connect to the database
  .then(() => db.open('db/db.sqlite3', {Promise}))
  .catch(err => console.error(err.stack))
  // Finally, launch Node.js app
  .finally(() => app.listen(port));
