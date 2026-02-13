const SMLV = 1750905;
const AUX_TRANSPORTE = 249095;
const FESTIVOS_2026 = ["2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29", "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25"];

function isFestivo(fechaStr) {
    if (FESTIVOS_2026.includes(fechaStr)) return true;
    const parts = fechaStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1]-1, parts[2]));
    const dow = d.getUTCDay();
    return dow === 0;
}

function calculateHourlyRate(salarioMensual, weeklyHours = 44) {
    if (!salarioMensual || salarioMensual <= 0) return 0;
    const annual = salarioMensual * 12;
    const totalHoursYear = weeklyHours * 52;
    return annual / totalHoursYear;
}

function calculateIBC(salarioMensual) {
    if (!salarioMensual) return 0;
    if (salarioMensual <= 2 * SMLV) return salarioMensual + AUX_TRANSPORTE;
    return salarioMensual;
}

function baseHoursForTurno(turno) {
    if (turno === 'descanso') return 0;
    if (turno === 'vacaciones') return 8;
    if (turno === 'reduccion') return 4;
    return 8;
}

const MAX_WEEKLY_HOURS = 44;
const WORK_TURNOS = new Set(["am", "pm", "reduccion", "nocturno"]);
const NIGHT_START_HOUR = 21;
const NIGHT_END_HOUR = 6;

function isNocturnoTurno(turno) {
    return turno === 'nocturno';
}

function getShiftSchedule(turno) {
    switch (turno) {
        case 'am':
            return { start: 6, end: 14, overnight: false };
        case 'pm':
            return { start: 14, end: 22, overnight: false };
        case 'reduccion':
            return { start: 16, end: 20, overnight: false };
        case 'nocturno':
            return { start: 22, end: 6, overnight: true };
        case 'vacaciones':
            return { start: 8, end: 16, overnight: false };
        default:
            return null;
    }
}

function calcNightHoursForTurno(turno, baseH) {
    if (!baseH) return 0;
    const schedule = getShiftSchedule(turno);
    if (!schedule) return 0;

    const nightSegments = [
        { start: NIGHT_START_HOUR, end: 24 },
        { start: 0, end: NIGHT_END_HOUR }
    ];

    const shiftSegments = schedule.overnight
        ? [
            { start: schedule.start, end: 24 },
            { start: 0, end: schedule.end }
        ]
        : [{ start: schedule.start, end: schedule.end }];

    let nightHours = 0;
    shiftSegments.forEach(shift => {
        nightSegments.forEach(night => {
            const overlapStart = Math.max(shift.start, night.start);
            const overlapEnd = Math.min(shift.end, night.end);
            if (overlapEnd > overlapStart) nightHours += (overlapEnd - overlapStart);
        });
    });

    return Math.min(baseH, nightHours);
}

function parseDateUTC(fechaStr) {
    const parts = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function formatDateUTC(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const d = dateObj.getUTCDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getWeekStartUTC(dateObj) {
    const dow = dateObj.getUTCDay();
    const diff = (dow + 6) % 7; // Monday-based week start
    const ws = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
    ws.setUTCDate(ws.getUTCDate() - diff);
    return formatDateUTC(ws);
}

// Tarifas y recargos: valores según normativa (configurables)
const NIGHT_SURCHARGE = 0.35; // 35% recargo nocturno sobre hora ordinaria
const FESTIVE_SURCHARGE = 1.0; // 100% adicional en día festivo (doble valor)

function overtimeFactor(turno, esFestivoDia) {
    // Horas extras multiplicador según tipo de día/turno
    // - Extra en día ordinario: 1.25
    // - Extra nocturna en día ordinario: 1.75
    // - Extra en festivo (diurna): 2.00
    // - Extra nocturna en festivo: 2.50
    if (esFestivoDia && isNocturnoTurno(turno)) return 2.5;
    if (esFestivoDia) return 2.0;
    if (isNocturnoTurno(turno)) return 1.75;
    return 1.25;
}

function calculateDayPayment(fechaStr, config, salarioMensual) {
    const hourly = calculateHourlyRate(salarioMensual);
    const esFest = isFestivo(fechaStr);
    const baseH = baseHoursForTurno(config.turno);
    const basePagoSinRecargo = baseH * hourly;
    const nightHours = calcNightHoursForTurno(config.turno, baseH);
    const recargoNocturno = nightHours * hourly * NIGHT_SURCHARGE;
    
    // Detectar si es domingo (día 0 en UTC)
    const fechaObj = parseDateUTC(fechaStr);
    const esDomingo = fechaObj.getUTCDay() === 0;
    
    // El recargo festivo ahora es 1.8 (0.8 adicional)
    const recargoFestivo = esFest ? (baseH * hourly * 0.8) : 0;
    const recargo = recargoNocturno + recargoFestivo;
    const basePago = basePagoSinRecargo + recargo;
    const effectiveHourly = baseH > 0 ? (basePago / baseH) : hourly;
    const baseMultiplier = hourly > 0 ? (effectiveHourly / hourly) : 1;
    const extras = config.extras || 0;
    const factor = overtimeFactor(config.turno, esFest);
    const extrasPago = extras * hourly * factor;
    
    return { 
        basePago, 
        basePagoSinRecargo, 
        recargo, 
        recargoNocturno, 
        recargoFestivo, 
        extrasPago, 
        brutoDia: basePago + extrasPago, 
        hourly, 
        effectiveHourly, 
        baseMultiplier, 
        baseH, 
        factor, 
        esFest, 
        esDomingo,
        nightHours 
    };
}

function calculatePayrollSummary(year, monthIndex, dbState) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let totalBase = 0, totalExtras = 0;
    let totalExtrasCount = 0;
    let totalExtrasManuales = 0;
    let totalExtrasAuto = 0;
    let totalNightHours = 0;
    let totalRecargoNocturno = 0;
    let totalRecargoFestivo = 0;
    let totalRecargoDomingo = 0;
    const rows = [];
    let totalRecargos = 0;

    const dayList = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const fecha = `${year}-${(monthIndex+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const dateObj = parseDateUTC(fecha);
        const conf = dbState.diasConfig[fecha] || { turno: 'descanso', extras: 0 };
        const baseH = baseHoursForTurno(conf.turno);
        const weeklyBaseH = WORK_TURNOS.has(conf.turno) ? baseH : 0;
        dayList.push({ fecha, dateObj, conf, weeklyBaseH });
    }

    const weeks = new Map();
    dayList.forEach(day => {
        const weekStart = getWeekStartUTC(day.dateObj);
        if (!weeks.has(weekStart)) weeks.set(weekStart, []);
        weeks.get(weekStart).push(day);
    });

    const autoExtrasByDate = {};
    weeks.forEach(days => {
        let weeklyHours = 0;
        days.sort((a, b) => a.dateObj - b.dateObj);
        for (const day of days) {
            if (day.weeklyBaseH > 0) {
                weeklyHours += day.weeklyBaseH;
                if (weeklyHours > MAX_WEEKLY_HOURS) {
                    const overflow = weeklyHours - MAX_WEEKLY_HOURS;
                    const autoH = Math.min(day.weeklyBaseH, overflow);
                    autoExtrasByDate[day.fecha] = (autoExtrasByDate[day.fecha] || 0) + autoH;
                }
            }
        }
    });

    // Contar domingos trabajados en el mes para clasificación
    let domingosTrabajados = 0;
    const domingosFechas = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const fecha = `${year}-${(monthIndex+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const fechaObj = parseDateUTC(fecha);
        const conf = dbState.diasConfig[fecha] || { turno: 'descanso', extras: 0 };
        if (fechaObj.getUTCDay() === 0 && conf.turno !== 'descanso' && conf.turno !== 'vacaciones') {
            domingosTrabajados++;
            domingosFechas.push(fecha);
        }
    }
    
    // Clasificar como ocasional (<=2) o habitual (>=3)
    const esHabitual = domingosTrabajados >= 3;
    
    // Para domingos ocasionales, verificar si tienen compensatorio
    const compensatoriosPorDomingo = {};
    if (!esHabitual && domingosFechas.length > 0) {
        domingosFechas.forEach(f => {
            const conf = dbState.diasConfig[f] || {};
            compensatoriosPorDomingo[f] = conf.tieneCompensatorio || false;
        });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const fecha = `${year}-${(monthIndex+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const conf = dbState.diasConfig[fecha] || { turno: 'descanso', extras: 0 };
        const autoExtras = autoExtrasByDate[fecha] || 0;
        const extrasTotal = (conf.extras || 0) + autoExtras;
        const pago = calculateDayPayment(fecha, { ...conf, extras: extrasTotal }, dbState.salario || 0);
        
        // Calcular recargo por domingo si aplica
        let recargoDomingo = 0;
        if (pago.esDomingo && conf.turno !== 'descanso' && conf.turno !== 'vacaciones' && !pago.esFest) {
            const hourly = pago.hourly;
            const baseH = pago.baseH;
            
            if (esHabitual) {
                // Habitual: 0.8 recargo adicional
                recargoDomingo = baseH * hourly * 0.8;
            } else {
                // Ocasional: con compensatorio 0.8, sin compensatorio 1.8
                const tieneComp = compensatoriosPorDomingo[fecha] || false;
                recargoDomingo = baseH * hourly * (tieneComp ? 0.8 : 1.8);
            }
        }
        
        totalBase += pago.basePago;
        totalExtras += pago.extrasPago;
        totalExtrasCount += extrasTotal;
        totalExtrasManuales += (conf.extras || 0);
        totalExtrasAuto += autoExtras;
        totalNightHours += pago.nightHours || 0;
        totalRecargoNocturno += pago.recargoNocturno || 0;
        totalRecargoFestivo += pago.recargoFestivo || 0;
        totalRecargoDomingo += recargoDomingo;
        totalRecargos += (pago.recargo || 0) + recargoDomingo;
        
        rows.push({ 
            fecha, 
            turno: conf.turno, 
            extras: extrasTotal,
            extrasManuales: conf.extras || 0,
            extrasAuto: autoExtras, 
            brutoDia: pago.brutoDia + recargoDomingo, 
            esFest: pago.esFest, 
            esDomingo: pago.esDomingo,
            nightHours: pago.nightHours || 0, 
            recargoNocturno: pago.recargoNocturno || 0, 
            recargoFestivo: pago.recargoFestivo || 0, 
            recargoDomingo: recargoDomingo,
            recargo: (pago.recargo || 0) + recargoDomingo 
        });
    }

    const salarioBase = dbState.salario || 0;
    // Auxilio de transporte ahora se paga a todos los colaboradores
    const incluyeAux = true;
    const ibc = salarioBase + (incluyeAux ? AUX_TRANSPORTE : 0);
    const brutoMensual = salarioBase + totalExtras + totalRecargos;
    const salud = ibc * 0.04;
    const pension = ibc * 0.04;
    const descuentos = salud + pension;
    const neto = brutoMensual - descuentos;

    return { 
        rows, 
        totalBase, 
        totalExtras, 
        totalExtrasCount,
        totalExtrasManuales,
        totalExtrasAuto, 
        totalNightHours, 
        totalRecargoNocturno, 
        totalRecargoFestivo, 
        totalRecargoDomingo,
        totalRecargos, 
        incluyeAux, 
        brutoMensual, 
        ibc, 
        salud, 
        pension, 
        descuentos, 
        neto,
        domingosTrabajados,
        esHabitual,
        domingosFechas,
        compensatoriosPorDomingo
    };
}

// Exponer en global para uso sin módulos
window.SMLV = SMLV;
window.AUX_TRANSPORTE = AUX_TRANSPORTE;
window.FESTIVOS_2026 = FESTIVOS_2026;
window.isFestivo = isFestivo;
window.calculateHourlyRate = calculateHourlyRate;
window.calculateIBC = calculateIBC;
window.baseHoursForTurno = baseHoursForTurno;
window.overtimeFactor = overtimeFactor;
window.calculateDayPayment = calculateDayPayment;
window.calculatePayrollSummary = calculatePayrollSummary;
