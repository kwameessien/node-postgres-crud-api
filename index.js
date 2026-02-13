const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const db = require('./queries');
const authRoutes = require('./routes/auth');

require('./config/passport');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

// Public routes
app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
});
app.use('/auth', authRoutes);

// Protected routes (require JWT)
const requireAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing token' });
    req.user = user;
    next();
  })(req, res, next);
};
app.get('/users', requireAuth, db.getUsers);
app.get('/users/:id', requireAuth, db.getUserById);
app.post('/users', requireAuth, db.createUser);
app.put('/users/:id', requireAuth, db.updateUser);
app.delete('/users/:id', requireAuth, db.deleteUser);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handling middleware (must have 4 args)
app.use((err, req, res, next) => {
  console.error(err.message);
  let status = 500;
  if (err.message === 'User not found' || err.message === 'Invalid user ID') status = 404;
  else if (err.message === 'Name and email are required' || err.message === 'Name, email and password are required' || err.message === 'Email already registered') status = 400;
  else if (err.message === 'Invalid email or password') status = 401;
  res.status(status).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
