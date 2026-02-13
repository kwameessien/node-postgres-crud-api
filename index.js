const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const db = require('./queries');
const authRoutes = require('./routes/auth');
const { requireAdmin, requireOwnerOrAdmin } = require('./middleware/authorize');

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
// Authorization: list all users and create users = admin only
app.get('/users', requireAuth, requireAdmin, db.getUsers);
app.post('/users', requireAuth, requireAdmin, db.createUser);
// Authorization: get/update/delete = admin or resource owner
app.get('/users/:id', requireAuth, requireOwnerOrAdmin, db.getUserById);
app.put('/users/:id', requireAuth, requireOwnerOrAdmin, db.updateUser);
app.delete('/users/:id', requireAuth, requireOwnerOrAdmin, db.deleteUser);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handling middleware (must have 4 args)
app.use((err, req, res, next) => {
  console.error(err.message);
  let status = 500;
  if (err.message === 'User not found' || err.message === 'Invalid user ID') status = 404;
  else if (err.message === 'Name and email are required' || err.message === 'Name, email and password are required' || err.message === 'Email already registered' || err.message === 'Admin already exists') status = 400;
  else if (err.message === 'Invalid email or password') status = 401;
  else if (err.message === 'Insufficient permissions' || err.message === 'You can only access your own resources') status = 403;
  res.status(status).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
