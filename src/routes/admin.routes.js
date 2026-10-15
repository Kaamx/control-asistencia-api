const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/reports', verifyToken, verifyAdmin, adminController.getGlobalReport);

module.exports = router;