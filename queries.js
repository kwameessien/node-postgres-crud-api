const Pool = require('pg').Pool;
const bcrypt = require('bcrypt');
const pool = new Pool({
  user: process.env.PGUSER || process.env.DB_USER || 'kwameessien',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || process.env.DB_NAME || 'postgres',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
  port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
});
const getUsers = (request, response, next) => {
  pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC', (error, results) => {
    if (error) return next(error);
    response.status(200).json(results.rows);
  });
};

const getUserById = (request, response, next) => {
  const id = parseInt(request.params.id, 10);

  pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id], (error, results) => {
    if (error) return next(error);
    if (results.rows.length === 0) return next(new Error('User not found'));
    response.status(200).json(results.rows[0]);
  });
};

const createUser = (request, response, next) => {
  const { name, email } = request.body;

  pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, role',
    [name, email],
    (error, results) => {
      if (error) return next(error);
      response.status(201).json(results.rows[0]);
    }
  );
};

const updateUser = (request, response, next) => {
  const id = parseInt(request.params.id, 10);
  const { name, email } = request.body;

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
    [name, email, id],
    (error, results) => {
      if (error) return next(error);
      if (results.rows.length === 0) return next(new Error('User not found'));
      response.status(200).json(results.rows[0]);
    }
  );
};

const deleteUser = (request, response, next) => {
  const id = parseInt(request.params.id, 10);

  pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email, role', [id], (error, results) => {
    if (error) return next(error);
    if (results.rows.length === 0) return next(new Error('User not found'));
    response.status(200).json({ message: `User ${id} deleted`, deleted: results.rows[0] });
  });
};

const registerUser = (request, response, next) => {
  const { name, email, password } = request.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return next(err);
    pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hash, 'user'],
      (error, results) => {
        if (error) {
          if (error.code === '23505') return next(new Error('Email already registered'));
          return next(error);
        }
        response.status(201).json(results.rows[0]);
      }
    );
  });
};

const createAdmin = (request, response, next) => {
  pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin'], (err, countResult) => {
    if (err) return next(err);
    if (parseInt(countResult.rows[0].count, 10) > 0) {
      return next(new Error('Admin already exists'));
    }
    const { name, email, password } = request.body;

    bcrypt.hash(password, 10, (hashErr, hash) => {
      if (hashErr) return next(hashErr);
      pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, hash, 'admin'],
        (error, results) => {
          if (error) {
            if (error.code === '23505') return next(new Error('Email already registered'));
            return next(error);
          }
          response.status(201).json(results.rows[0]);
        }
      );
    });
  });
};

module.exports = {
  pool,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registerUser,
  createAdmin,
};
