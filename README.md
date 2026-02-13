# DEspacho_pago

Aplicación cliente para cálculo de nómina y calendario de turnos (prototipo).

## Características

- Registro e inicio de sesión local (cédula + clave).
- Configuración de turnos por día y horas extra.
- Motor de cálculo con recargos, IBC y auxilio de transporte (Colombia 2026).
- Exportar PDF del detalle de nómina con desglose completo.
- Responsive y preparado para despliegue en hosting estático.

## Características de Cálculo de Nómina

### Parámetros Laborales (Colombia 2026)
- **SMLV**: $1,750,905 COP
- **Auxilio de transporte**: $249,095 COP (se paga a todos los colaboradores)
- **Semana laboral**: 44 horas
- **Cálculo valor hora**: Salario mensual ÷ 220 horas mensuales
- **IBC (Ingreso Base de Cotización)**: Salario base + auxilio de transporte
- **Descuentos**: Salud 4% y Pensión 4% sobre IBC

### Turnos y Recargos

#### Tipos de Turnos
- **Descanso**: 0 horas
- **AM**: 6:00 - 14:00 (8 horas)
- **PM**: 14:00 - 22:00 (8 horas)
- **Reducción**: 16:00 - 20:00 (4 horas)
- **Nocturno**: 22:00 - 6:00 (8 horas)
- **Vacaciones**: 8 horas

#### Recargo Nocturno
- **35% adicional** sobre las horas trabajadas entre 21:00 y 6:00
- Se calcula por overlap real del turno con el período nocturno

#### Recargo Festivo
- **80% adicional** (1.8 total) por hora trabajada en días festivos
- Aplica a todos los turnos en días festivos

#### Trabajo en Domingo

**Clasificación Mensual:**
- **Ocasional**: 2 o menos domingos trabajados en el mes
- **Habitual**: 3 o más domingos trabajados en el mes

**Recargos por Domingo (no festivo):**
- **Ocasional con compensatorio**: 80% adicional (1.8 total)
- **Ocasional sin compensatorio**: 180% adicional (1.8 total) 
- **Habitual**: 80% adicional (1.8 total) + día compensatorio obligatorio

**Nota**: Los domingos que coincidan con festivos solo aplican recargo festivo.

### Horas Extra

**Factores de Multiplicación:**
- **Ordinaria diurna**: 1.25x
- **Ordinaria nocturna**: 1.75x
- **Festivo diurna**: 2.0x
- **Festivo nocturna**: 2.5x

**Control Semanal:**
- Semana se mide de lunes a domingo
- Si se exceden las 44 horas semanales, el excedente se marca automáticamente como horas extra
- Las horas extra manuales se suman a las automáticas

### PDF de Nómina

El PDF incluye:
- Resumen del período con clasificación del trabajador (ocasional/habitual)
- Desglose de recargos: nocturno, festivo y domingo
- Tabla detallada por día con horas nocturnas y recargos aplicados
- Cálculo de IBC, descuentos de salud y pensión
- Alertas de días compensatorios requeridos

## Notas sobre seguridad

- Este prototipo guarda usuarios y contraseñas en `localStorage` sin cifrar: es adecuado solo para demostraciones locales. Para producción, implementar backend y almacenamiento seguro.

## Archivos clave

- `index.html` — UI principal
- `style.css` — estilos
- `script.js` — lógica UI y autenticación local
- `calculations.js` — motor de cálculo



