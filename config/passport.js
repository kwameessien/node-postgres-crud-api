const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const db = require('../queries');

const pool = db.pool;

// Local strategy for login (email + password)
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        const user = result.rows[0];
        if (!user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// JWT strategy for protecting routes
const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
};

passport.use(
  new JwtStrategy(jwtOpts, async (payload, done) => {
    try {
      const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [payload.sub]);
      if (result.rows.length === 0) return done(null, false);
      return done(null, result.rows[0]);
    } catch (err) {
      return done(err);
    }
  })
);
