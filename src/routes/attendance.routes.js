const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/check-in', verifyToken, attendanceController.handleCheckIn);
router.post('/check-out', verifyToken, attendanceController.handleCheckOut);
router.get('/history/:userId', verifyToken, attendanceController.getUserHistory);

// Autogestión de horarios del practicante
router.post('/my-schedule', verifyToken, attendanceController.handleSaveMySchedule);

module.exports = router;