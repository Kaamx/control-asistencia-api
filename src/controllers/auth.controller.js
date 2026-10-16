const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: La variable de entorno JWT_SECRET no está definida.');
}

/**
 * Registro de nuevos usuarios
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // El rol siempre es 'intern' en el registro público.
    // La asignación de roles privilegiados requiere acción de un admin.
    const userRole = 'intern';

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: newUser.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login y generación de JWT seguro
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.'
      });
    }

    const user = result.rows[0];

    // Comparar con user.password_hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};