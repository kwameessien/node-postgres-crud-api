const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const db = require('../queries');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register - creates user with hashed password
router.post('/register', db.registerUser);

// Login - returns JWT
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  })(req, res, next);
});

module.exports = router;
