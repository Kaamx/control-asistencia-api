const db = require('../config/db');

class AttendanceService {
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

  // Reporte global detallado con sesiones para el Admin
  async getAllPracticantsReport() {
    // 1. Obtener todos los practicantes con sus horas totales
    const usersResult = await db.query(`
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

    // 2. Para cada usuario, traer sus sesiones (historial de marcajes)
    const users = usersResult.rows;
    for (let user of users) {
      const logsResult = await db.query(`
        SELECT check_in, check_out, total_hours, status 
        FROM attendance_logs 
        WHERE user_id = $1 
        ORDER BY check_in DESC
      `, [user.id]);
      
      user.sessions = logsResult.rows;
    }

    return users;
  }
}

module.exports = new AttendanceService();