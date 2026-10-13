const db = require('../config/db');

class AttendanceService {
  // Registrar Entrada (Check-In)
  async checkIn(userId) {
    const activeCheck = await db.query(
      `SELECT id FROM attendance_logs WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (activeCheck.rows.length > 0) {
      throw new Error('Ya tienes un marcaje de entrada activo. Marca salida primero.');
    }

    const result = await db.query(
      `INSERT INTO attendance_logs (user_id, check_in, status) 
       VALUES ($1, CURRENT_TIMESTAMP, 'active') RETURNING *`,
      [userId]
    );

    return result.rows[0];
  }

  // Registrar Salida (Check-Out) y calcular horas netas
  async checkOut(userId) {
    const activeCheck = await db.query(
      `SELECT * FROM attendance_logs WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (activeCheck.rows.length === 0) {
      throw new Error('No tienes ninguna entrada activa para marcar salida.');
    }

    const log = activeCheck.rows[0];
    const checkInTime = new Date(log.check_in);
    const checkOutTime = new Date();

    const diffMs = checkOutTime - checkInTime;
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    const result = await db.query(
      `UPDATE attendance_logs 
       SET check_out = CURRENT_TIMESTAMP, total_hours = $1, status = 'completed'
       WHERE id = $2 RETURNING *`,
      [totalHours, log.id]
    );

    return result.rows[0];
  }

  // Obtener historial y total acumulado por usuario
  async getUserStats(userId) {
    const logs = await db.query(
      `SELECT id, check_in, check_out, total_hours, status 
       FROM attendance_logs WHERE user_id = $1 ORDER BY check_in DESC`,
      [userId]
    );

    const sumResult = await db.query(
      `SELECT COALESCE(SUM(total_hours), 0) AS total_accumulated 
       FROM attendance_logs WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    return {
      logs: logs.rows,
      totalHours: parseFloat(sumResult.rows[0].total_accumulated)
    };
  }

  // Obtener reporte global de todos los practicantes (para el Admin)
  async getAllPracticantsReport() {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.created_at,
        COALESCE(SUM(a.total_hours), 0) AS total_accumulated_hours
      FROM users u
      LEFT JOIN attendance_logs a ON u.id = a.user_id AND a.status = 'completed'
      WHERE u.role = 'intern'
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY total_accumulated_hours DESC;
    `);
    return result.rows;
  }
}

module.exports = new AttendanceService();