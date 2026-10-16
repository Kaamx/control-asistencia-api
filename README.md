# Sistema de Control de Asistencia - Prácticas

Herramienta diseñada para el control, marcaje y supervisión de horas de asistencia de practicantes, estructurada bajo una arquitectura en capas con Node.js, Express y PostgreSQL.

---

## Funcionalidades Principales

* **Autenticación Segura:** Registro de nuevos usuarios con validación de confirmación de contraseña y cifrado mediante `bcryptjs`. Inicio de sesión manual con redirección basada en roles (`intern` o `admin`). El registro público siempre asigna el rol `intern`; los roles administrativos se gestionan directamente en base de datos.
* **Módulo de Asistencia (Practicante):**
  * Marcaje de **Entrada (Check-In)** y **Salida (Check-Out)** en tiempo real.
  * Evaluación automática de puntualidad: detecta **"A TIEMPO"** o **"TARDANZA"** comparando la hora de entrada con el horario asignado (tolerancia de 15 minutos).
  * Cálculo automático de horas netas laboradas por turno.
  * Historial detallado de sesiones y contador visual del total de horas acumuladas.
  * **Autogestión de Horario:** el practicante puede configurar visualmente su propio horario semanal (días, hora de inicio, hora de fin y tipo de actividad) directamente desde su panel.
* **Módulo de Horarios:**
  * **Carga masiva** desde archivos Excel (`.xlsx`, `.xls`) o CSV mediante parser inteligente que interpreta rangos de días (`Lunes-Viernes`), formatos de hora flexibles y múltiples separadores.
  * Soporte para pegar texto tabulado directamente desde Excel o correo.
  * Descarga de plantilla CSV de ejemplo.
* **Módulo de Supervisión (Administrador):**
  * Reporte global consolidado de todos los practicantes con horas acumuladas totales.
  * Desglose por pestañas: **Horarios Asignados** e **Historial de Sesiones** por practicante.
  * Búsqueda en tiempo real por nombre o correo electrónico.
  * Exportación del reporte consolidado a Excel (`.xlsx`).

---

## Seguridad

* Autenticación basada en **JWT** (`jsonwebtoken`) con expiración de 8 horas.
* Todas las rutas de asistencia y administración protegidas con middleware `verifyToken`.
* Rutas administrativas protegidas adicionalmente con middleware `verifyAdmin`.
* Hashing de contraseñas con **bcryptjs** (salt factor 10).
* Protección de cabeceras HTTP mediante **Helmet**.
* Limitación de peticiones con **express-rate-limit**: 100 req/15 min globales y 5 req/min en el endpoint de login.
* Credenciales de base de datos gestionadas exclusivamente por variables de entorno (`.env`).
* Prevención de inyección SQL mediante consultas parametrizadas en `pg`.
* Payload de peticiones limitado a 10 KB.

---

## Tecnologías y Stack Utilizado

* **Backend:** Node.js, Express.js
* **Base de Datos:** PostgreSQL
* **Seguridad:** Bcryptjs, JWT, Helmet, express-rate-limit
* **Frontend:** HTML5, JavaScript (Vanilla / Fetch API), TailwindCSS, SheetJS (xlsx)
* **Control de Sesión:** Navegador `localStorage`

---

## Estructura del Proyecto

```
src/
├── app.js                        # Punto de entrada, middlewares globales y rutas
├── config/
│   └── db.js                     # Configuración del pool de conexión a PostgreSQL
├── controllers/
│   ├── auth.controller.js        # Registro y login de usuarios
│   ├── attendance.controller.js  # Check-in, check-out, historial y horario propio
│   └── admin.controller.js       # Reporte global de practicantes
├── middlewares/
│   ├── authMiddleware.js         # verifyToken y verifyAdmin
│   └── validateAuth.js           # Validación de campos en registro
├── routes/
│   ├── auth.routes.js            # POST /api/auth/register, /login
│   ├── attendance.routes.js      # POST /api/attendance/check-in, check-out, my-schedule | GET /history/:userId
│   └── admin.routes.js           # GET /api/admin/reports | POST /api/admin/import-schedules
├── services/
│   └── attendance.service.js     # Lógica de negocio: checkIn, checkOut, stats, reporte global
└── public/
    ├── login.html                # Vista de autenticación (login + registro)
    ├── index.html                # Panel del practicante
    └── admin.html                # Panel del administrador / supervisor
```

---

## Base de Datos

El esquema completo se encuentra en `database.sql` e incluye las tablas `users`, `attendance_logs` y `schedules`, junto con los índices de rendimiento y un usuario de prueba inicial.

```
Correo: practicante@correo.com
Contraseña: 123456
```