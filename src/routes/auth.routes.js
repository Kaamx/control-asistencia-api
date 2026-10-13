const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Ruta para registrar usuario: POST /api/auth/register
router.post('/register', authController.register);

// Ruta para iniciar sesión: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;