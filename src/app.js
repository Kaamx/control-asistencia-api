const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Limitación estricta de tamaño de Payload
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiadas peticiones desde esta IP, intente de nuevo en 15 minutos.' }
});
app.use('/api/', globalLimiter);

// Rate Limiting Específico para Autenticación
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Demasiados intentos de acceso. Por favor espere un minuto.' }
});
app.use('/api/auth/login', authLimiter);

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de las APIs
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// MANEJADOR GLOBAL DE ERRORES 500 (Catch-all)
app.use((err, req, res, next) => {
  // Guardar log interno en consola/archivo para depuración posterior
  console.error(`[ERROR NO CONTROLADO] ${new Date().toISOString()}:`, err.stack || err);

  res.status(500).json({
    success: false,
    message: 'Ocurrió un error interno en el servidor. Por favor intente más tarde.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor seguro corriendo en el puerto ${PORT}`);
});