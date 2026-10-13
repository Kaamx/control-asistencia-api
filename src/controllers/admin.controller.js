const attendanceService = require('../services/attendance.service');

exports.getGlobalReport = async (req, res) => {
  try {
    const report = await attendanceService.getAllPracticantsReport();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};