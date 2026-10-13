const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Registrar un nuevo usuario (practicante o admin)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar si el correo ya existe
    const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
    }

    // Encriptar la contraseña con bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar en la base de datos
    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role || 'intern']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente', 
      data: newUser.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar el usuario por email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas (correo no encontrado).' });
    }

    const user = result.rows[0];

    // Comparar la contraseña ingresada con el hash de la BD
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};