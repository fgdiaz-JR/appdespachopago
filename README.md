# NóminaPro

Aplicación cliente para cálculo de nómina y calendario de turnos (prototipo).

Características
- Registro e inicio de sesión local (cédula + clave).
- Configuración de turnos por día y horas extra.
- Motor de cálculo con recargos, IBC y validación de auxilio de transporte (Colombia 2026).
- Exportar PDF del detalle de nómina.
- Responsive y preparado para despliegue en hosting estático.

Preparar para GitHub y despliegue
1. Inicializa un repo local:

```bash
git init
git add .
git commit -m "Initial commit - NóminaPro"
```

2. Crea un repo en GitHub y sube los cambios:

```bash
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

3. Para publicar como sitio estático usa GitHub Pages o cualquier hosting estático (Netlify, Vercel): basta con apuntar al branch `main` y servir los archivos.

Notas sobre seguridad
- Este prototipo guarda usuarios y contraseñas en `localStorage` sin cifrar: es adecuado solo para demostraciones locales. Para producción, implementar backend y almacenamiento seguro.

Archivos clave
- `index.html` — UI principal
- `style.css` — estilos
- `script.js` — lógica UI y autenticación local
- `calculations.js` — motor de cálculo

License: MIT (add proper license file if needed)
