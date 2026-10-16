const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// 1. Ruta para obtener el reporte general de practicantes, sus sesiones y sus horarios
router.get('/reports', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    // Consulta para traer a los usuarios
    const usersQuery = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE role != 'admin' 
      ORDER BY created_at DESC
    `);

    const users = usersQuery.rows;
    const data = [];

    for (const user of users) {
      // Obtener las sesiones de asistencia desde attendance_logs
      const sessionsQuery = await pool.query(`
        SELECT id, check_in, check_out, total_hours, status 
        FROM attendance_logs 
        WHERE user_id = $1 
        ORDER BY check_in DESC
      `, [user.id]);

      // Calcular horas acumuladas totales desde attendance_logs
      const totalHoursQuery = await pool.query(`
        SELECT SUM(total_hours) as total 
        FROM attendance_logs 
        WHERE user_id = $1 AND status = 'completed'
      `, [user.id]);

      // NUEVO: Obtener los horarios asignados al practicante desde schedules
      const schedulesQuery = await pool.query(`
        SELECT id, day_of_week, start_time, end_time, activity_type 
        FROM schedules 
        WHERE user_id = $1 
        ORDER BY day_of_week ASC
      `, [user.id]);

      data.push({
        ...user,
        total_accumulated_hours: totalHoursQuery.rows[0].total || 0,
        sessions: sessionsQuery.rows,
        schedules: schedulesQuery.rows // Se añade al objeto de respuesta
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// 2. Ruta para la importación masiva de horarios con validación robusta y soporte total (Lunes a Domingo)
router.post('/import-schedules', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { schedulesData } = req.body;

    if (!schedulesData || !Array.isArray(schedulesData) || schedulesData.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron datos válidos para importar.' });
    }

    let insertedCount = 0;
    const notFoundEmails = [];

    for (const item of schedulesData) {
      const { email, day_of_week, start_time, end_time, activity_type } = item;

      if (!email || day_of_week === undefined || !start_time || !end_time) {
        continue; 
      }

      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (userRes.rows.length === 0) {
        if (!notFoundEmails.includes(email)) notFoundEmails.push(email);
        continue; 
      }

      const userId = userRes.rows[0].id;

      await pool.query(
        `INSERT INTO schedules (user_id, day_of_week, start_time, end_time, activity_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, day_of_week, start_time, end_time, activity_type]
      );
      
      insertedCount++;
    }

    if (insertedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo importar ningún horario. Los siguientes correos no están registrados en el sistema:',
        notFoundEmails
      });
    }

    res.json({ 
      success: true, 
      message: `Se importaron ${insertedCount} horarios correctamente.${notFoundEmails.length > 0 ? ' Algunos correos fueron omitidos por no existir.' : ''}`,
      notFoundEmails: notFoundEmails.length > 0 ? notFoundEmails : undefined
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;