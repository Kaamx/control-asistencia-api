const pool = require('../config/db');
const attendanceService = require('../services/attendance.service');

// Convertir hora "HH:MM:SS" a minutos totales
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

// 1. Manejo del Check-In con evaluación de tardanza
exports.handleCheckIn = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0=Lunes ... 6=Domingo

    let messageText = 'Entrada registrada con éxito';

    // Consultar horario asignado para hoy
    const scheduleRes = await pool.query(
      `SELECT start_time FROM schedules WHERE user_id = $1 AND day_of_week = $2`,
      [userId, dayOfWeek]
    );

    if (scheduleRes.rows.length > 0) {
      const schedule = scheduleRes.rows[0];
      const startMinutes = timeToMinutes(schedule.start_time);
      const toleranciaMinutos = 15;

      if (currentMinutes > (startMinutes + toleranciaMinutos)) {
        messageText = `Entrada registrada con TARDANZA (Su turno iniciaba a las ${schedule.start_time.slice(0,5)})`;
      } else {
        messageText = 'Entrada registrada A TIEMPO';
      }
    } else {
      messageText = 'Entrada registrada (Sin horario programado para hoy)';
    }

    // Registrar la entrada usando el servicio estándar (respeta el status 'active' de la BD)
    const record = await attendanceService.checkIn(userId);

    res.status(201).json({ 
      success: true, 
      message: messageText, 
      data: record 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Manejo del Check-Out
exports.handleCheckOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const record = await attendanceService.checkOut(userId);
    res.status(200).json({ success: true, message: 'Salida registrada con éxito', data: record });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. Historial e información del practicante
exports.getUserHistory = async (req, res) => {
  try {
    // Un practicante solo puede ver su propio historial; el admin puede ver cualquiera
    const requestedId = parseInt(req.params.userId, 10);
    if (req.user.role !== 'admin' && req.user.id !== requestedId) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }
    const userId = requestedId;
    const stats = await attendanceService.getUserStats(userId);
    
    // Obtener también los horarios asignados al practicante
    const scheduleRes = await pool.query(
      `SELECT day_of_week, start_time, end_time, activity_type FROM schedules WHERE user_id = $1 ORDER BY day_of_week ASC`,
      [userId]
    );

    stats.schedules = scheduleRes.rows;

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Guardar/Actualizar horario propio desde la vista del practicante
exports.handleSaveMySchedule = async (req, res) => {
  try {
    // userId siempre del token autenticado, no del body
    const userId = req.user.id;
    const { schedules } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ success: false, message: 'Formato de horario no válido o sin datos.' });
    }

    // Transacción: si algún INSERT falla, el DELETE se revierte
    const client = await pool.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM schedules WHERE user_id = $1', [userId]);
      for (const sch of schedules) {
        await client.query(
          `INSERT INTO schedules (user_id, day_of_week, start_time, end_time, activity_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, sch.day_of_week, sch.start_time, sch.end_time, sch.activity_type || 'Prácticas']
        );
      }
      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    res.status(200).json({ success: true, message: 'Horario actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};