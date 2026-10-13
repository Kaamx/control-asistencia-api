const attendanceService = require('../services/attendance.service');

exports.handleCheckIn = async (req, res) => {
  try {
    const userId = req.body.userId || 1;
    const record = await attendanceService.checkIn(userId);
    res.status(201).json({ success: true, message: 'Entrada registrada', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.handleCheckOut = async (req, res) => {
  try {
    const userId = req.body.userId || 1;
    const record = await attendanceService.checkOut(userId);
    res.status(200).json({ success: true, message: 'Salida registrada', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.params.userId || 1;
    const stats = await attendanceService.getUserStats(userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};