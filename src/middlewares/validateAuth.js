const validator = require('validator');

exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  // Validar formato de correo
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'El correo electrónico no es válido.' });
  }

  // Validar longitud de la contraseña
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  next(); // Si pasa las validaciones, continúa a la BD
};