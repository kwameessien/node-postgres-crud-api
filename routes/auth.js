const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const db = require('../queries');
const {
  handleValidation,
  registerValidator,
  loginValidator,
  createAdminValidator,
} = require('../middleware/validate');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Bootstrap first admin (only works when no admins exist)
router.post('/create-admin', createAdminValidator, handleValidation, db.createAdmin);

// Register - creates user with hashed password
router.post('/register', registerValidator, handleValidation, db.registerUser);

// Login - returns JWT
router.post('/login', loginValidator, handleValidation, (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  })(req, res, next);
});

module.exports = router;
