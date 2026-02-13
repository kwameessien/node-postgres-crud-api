const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./queries');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
});

app.get('/users', db.getUsers);
app.get('/users/:id', db.getUserById);
app.post('/users', db.createUser);
app.put('/users/:id', db.updateUser);
app.delete('/users/:id', db.deleteUser);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handling middleware (must have 4 args)
app.use((err, req, res, next) => {
  console.error(err.message);
  let status = 500;
  if (err.message === 'User not found' || err.message === 'Invalid user ID') status = 404;
  else if (err.message === 'Name and email are required') status = 400;
  res.status(status).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
