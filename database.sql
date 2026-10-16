-- Ejecutar en PostgreSQL (pgAdmin, psql, etc.):
-- CREATE DATABASE control_asistencia;

-- Conectarse a la base de datos 'control_asistencia' y ejecutar lo siguiente:

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'intern' CHECK (role IN ('intern', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Registros de Asistencia
CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar consultas por usuario en attendance_logs
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);

-- 3. Tabla de Horarios
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Lunes, 6=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity_type VARCHAR(100) DEFAULT 'Prácticas',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar consultas por usuario en schedules
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);

-- 4. Usuario de Prueba inicial 
-- Correo: practicante@correo.com | Contraseña en texto plano: 123456
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Juan Practicante', 'practicante@correo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'intern')
ON CONFLICT (email) DO NOTHING;