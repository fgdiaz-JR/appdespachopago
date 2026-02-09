# NóminaPro

Aplicación cliente para cálculo de nómina y calendario de turnos (prototipo).

Características
- Registro e inicio de sesión local (cédula + clave).
- Configuración de turnos por día y horas extra.
- Motor de cálculo con recargos, IBC y validación de auxilio de transporte (Colombia 2026).
- Exportar PDF del detalle de nómina.
- Responsive y preparado para despliegue en hosting estático.

Notas sobre seguridad
- Este prototipo guarda usuarios y contraseñas en `localStorage` sin cifrar: es adecuado solo para demostraciones locales. Para producción, implementar backend y almacenamiento seguro.

Archivos clave
- `index.html` — UI principal
- `style.css` — estilos
- `script.js` — lógica UI y autenticación local
- `calculations.js` — motor de cálculo


