# Sistema de Control de Asistencia - Prácticas

Herramienta diseñada para el control, marcaje y supervisión de horas de asistencia de practicantes, estructurada bajo una arquitectura en capas con Node.js, Express y PostgreSQL.

---

## Funcionalidades Principales

* **Autenticación Segura:** Registro de nuevos usuarios con validación de confirmación de contraseña y cifrado mediante `bcryptjs`. Inicio de sesión manual con redirección basada en roles (`intern` o `admin`).
* **Módulo de Asistencia (Practicante):**
  * Marcaje de **Entrada (Check-In)** y **Salida (Check-Out)** en tiempo real.
  * Cálculo automático de horas netas laboradas por turno.
  * Historial detallado de sesiones y contador visual del total de horas acumuladas.
* **Módulo de Supervisión (Administrador):**
  * Reporte global consolidado de todos los practicantes.
  * Desglose detallado por tarjetas y tablas de cada sesión individual (días, horas de entrada/salida y estado).

---

## Tecnologías y Stack Utilizado

* **Backend:** Node.js, Express.js
* **Base de Datos:** PostgreSQL
* **Seguridad:** Bcryptjs (Hashing seguro de contraseñas)
* **Frontend:** HTML5, JavaScript (Vanilla / Fetch API), TailwindCSS
* **Control de Sesión:** Navegador `localStorage`