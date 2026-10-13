const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

router.post('/check-in', attendanceController.handleCheckIn);
router.post('/check-out', attendanceController.handleCheckOut);
router.get('/history/:userId', attendanceController.getUserHistory);

module.exports = router;