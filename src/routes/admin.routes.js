const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Ruta: GET /api/admin/reports
router.get('/reports', adminController.getGlobalReport);

module.exports = router;