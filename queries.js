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
  pool.query('SELECT id, name, email FROM users ORDER BY id ASC', (error, results) => {
    if (error) return next(error);
    response.status(200).json(results.rows);
  });
};

const getUserById = (request, response, next) => {
  const id = parseInt(request.params.id);
  if (isNaN(id)) return next(new Error('Invalid user ID'));

  pool.query('SELECT id, name, email FROM users WHERE id = $1', [id], (error, results) => {
    if (error) return next(error);
    if (results.rows.length === 0) return next(new Error('User not found'));
    response.status(200).json(results.rows[0]);
  });
};

const createUser = (request, response, next) => {
  const { name, email } = request.body;
  if (!name || !email) return next(new Error('Name and email are required'));

  pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
    [name, email],
    (error, results) => {
      if (error) return next(error);
      response.status(201).json(results.rows[0]);
    }
  );
};

const updateUser = (request, response, next) => {
  const id = parseInt(request.params.id);
  const { name, email } = request.body;
  if (isNaN(id)) return next(new Error('Invalid user ID'));
  if (!name || !email) return next(new Error('Name and email are required'));

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
    [name, email, id],
    (error, results) => {
      if (error) return next(error);
      if (results.rows.length === 0) return next(new Error('User not found'));
      response.status(200).json(results.rows[0]);
    }
  );
};

const deleteUser = (request, response, next) => {
  const id = parseInt(request.params.id);
  if (isNaN(id)) return next(new Error('Invalid user ID'));

  pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [id], (error, results) => {
    if (error) return next(error);
    if (results.rows.length === 0) return next(new Error('User not found'));
    response.status(200).json({ message: `User ${id} deleted`, deleted: results.rows[0] });
  });
};

const registerUser = (request, response, next) => {
  const { name, email, password } = request.body;
  if (!name || !email || !password) {
    return next(new Error('Name, email and password are required'));
  }
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return next(err);
    pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash],
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

module.exports = {
  pool,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registerUser,
};
