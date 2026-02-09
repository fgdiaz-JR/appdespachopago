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

function calculateHourlyRate(salarioMensual, weeklyHours = 42) {
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
    return 8;
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
    if (esFestivoDia && turno === 'nocturno') return 2.5;
    if (esFestivoDia) return 2.0;
    if (turno === 'nocturno') return 1.75;
    return 1.25;
}

function calculateDayPayment(fechaStr, config, salarioMensual) {
    const hourly = calculateHourlyRate(salarioMensual);
    const esFest = isFestivo(fechaStr);
    const baseH = baseHoursForTurno(config.turno);
    // Calcular recargo sobre hora base
    let baseMultiplier = 1;
    if (config.turno === 'nocturno') baseMultiplier += NIGHT_SURCHARGE;
    if (esFest) baseMultiplier += FESTIVE_SURCHARGE;
    const effectiveHourly = hourly * baseMultiplier;
    const basePago = baseH * effectiveHourly;
    const basePagoSinRecargo = baseH * hourly;
    const recargo = basePago - basePagoSinRecargo;
    const extras = config.extras || 0;
    const factor = overtimeFactor(config.turno, esFest);
    const extrasPago = extras * hourly * factor;
    return { basePago, basePagoSinRecargo, recargo, extrasPago, brutoDia: basePago + extrasPago, hourly, effectiveHourly, baseMultiplier, baseH, factor, esFest };
}

function calculatePayrollSummary(year, monthIndex, dbState) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let totalBase = 0, totalExtras = 0;
    let totalExtrasCount = 0;
    const rows = [];
    let totalRecargos = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const fecha = `${year}-${(monthIndex+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const conf = dbState.diasConfig[fecha] || { turno: 'descanso', extras: 0 };
        const pago = calculateDayPayment(fecha, conf, dbState.salario || 0);
        totalBase += pago.basePago;
        totalExtras += pago.extrasPago;
        totalExtrasCount += conf.extras || 0;
        totalRecargos += pago.recargo || 0;
        rows.push({ fecha, turno: conf.turno, extras: conf.extras || 0, brutoDia: pago.brutoDia, esFest: pago.esFest });
    }

    const salarioBase = dbState.salario || 0;
    // Decidir auxilio transporte según la suma de salario + recargos + extras
    const brutoParaAux = salarioBase + totalRecargos + totalExtras;
    const incluyeAux = brutoParaAux <= (2 * SMLV);
    const ibc = salarioBase + (incluyeAux ? AUX_TRANSPORTE : 0);
    const brutoMensual = salarioBase + totalExtras + totalRecargos;
    const salud = ibc * 0.04;
    const pension = ibc * 0.04;
    const descuentos = salud + pension;
    const neto = brutoMensual - descuentos;

    return { rows, totalBase, totalExtras, totalExtrasCount, totalRecargos, brutoParaAux, incluyeAux, brutoMensual, ibc, salud, pension, descuentos, neto };
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
