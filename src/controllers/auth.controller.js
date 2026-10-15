const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const pool = require('../config/db');

// Clave secreta para firmar los JWT
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('FATAL: La variable de entorno JWT_SECRET no está definida.');
}

/**
 * Registro de nuevos usuarios
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar si el correo ya está registrado en la BD
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

    // Cifrado de contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Definir rol por defecto si no se proporciona ('intern')
    const userRole = role || 'intern';

    // Insertar el nuevo usuario en la BD
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: newUser.rows[0]
    });
  } catch (error) {
    // Pasa el error al manejador global 500 de Express
    next(error);
  }
};

/**
 * Inicio de Sesión (Login) y generación de JWT
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por correo electrónico
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.'
      });
    }

    const user = result.rows[0];

    // Validar la contraseña contra el hash de la BD
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.'
      });
    }

    // 3. Generar JWT — REGLA DE SEGURIDAD: Solo se almacena id y role en el payload
    const payload = {
      id: user.id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60)
    };

    //
    const token = jwt.encode(payload, JWT_SECRET);

    // Responder al cliente con el token
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
    // Pasa el error al manejador global 500 de Express
    next(error);
  }
};