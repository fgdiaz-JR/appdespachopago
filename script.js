// Clean, complete script.js
let db = JSON.parse(localStorage.getItem('nomina_v4')) || { nombre: "", salario: 0, diasConfig: {} };
let diaSeleccionado = null;
let currentYear = 2026;
let currentMonth = 2; // Marzo (0-indexado es 2)
let currentUser = localStorage.getItem('nomina_current') || null;

// Validación y helpers de UI
function setError(fieldId, message) {
    const err = document.getElementById(`error-${fieldId}`);
    if (err) err.innerText = message;
    const input = document.getElementById(fieldId);
    if (input) input.classList.add('invalid');
}

function clearError(fieldId) {
    const err = document.getElementById(`error-${fieldId}`);
    if (err) err.innerText = '';
    const input = document.getElementById(fieldId);
    if (input) input.classList.remove('invalid');
}

function validarYIrAPaso(p) {
    const nombreEl = document.getElementById('nombre');
    const salarioEl = document.getElementById('salario');
    const nombre = (nombreEl && nombreEl.value) ? nombreEl.value.trim() : '';
    const salario = salarioEl ? Number(salarioEl.value) : 0;

    clearError('nombre'); clearError('salario');

    let ok = true;
    if (!nombre || nombre.length < 3) { setError('nombre', 'Ingresa tu nombre completo.'); ok = false; }
    if (!salario || isNaN(salario) || salario <= 0) { setError('salario', 'Ingresa un salario válido mayor a 0.'); ok = false; }

    if (!ok) return;

    db.nombre = nombre;
    db.salario = Math.round(salario);
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    irAPaso(p);
}

// Prefill inputs y listeners para limpiar errores y mostrar legal info
document.addEventListener('DOMContentLoaded', () => {
    const nombreEl = document.getElementById('nombre');
    const salarioEl = document.getElementById('salario');
    if (nombreEl && db.nombre) nombreEl.value = db.nombre;
    if (salarioEl && db.salario) salarioEl.value = db.salario;
    if (nombreEl) nombreEl.addEventListener('input', () => clearError('nombre'));
    if (salarioEl) salarioEl.addEventListener('input', () => clearError('salario'));
    const info = document.getElementById('legal-info');
    if (info && window.SMLV !== undefined && window.AUX_TRANSPORTE !== undefined) info.innerText = `SMLV 2026: ${SMLV.toLocaleString('es-CO')} · Auxilio de transporte: ${AUX_TRANSPORTE.toLocaleString('es-CO')}`;
    loadUserList();
    // Auto-login if a user is set
    if (currentUser) {
        const usersJson = localStorage.getItem('nomina_users') || '{}';
        try {
            const users = JSON.parse(usersJson);
            if (users[currentUser]) {
                db = users[currentUser];
                localStorage.setItem('nomina_v4', JSON.stringify(db));
                showMainUI();
            } else {
                currentUser = null;
                localStorage.removeItem('nomina_current');
            }
        } catch(e) { /* ignore */ }
    }
    // global outside-click handler to close quick menus (one listener only)
    document.addEventListener('click', (evt) => {
        if (window._openQuickMenu) {
            const insideMenu = evt.target.closest && evt.target.closest('.quick-menu');
            const isToggle = evt.target.closest && evt.target.closest('.quick-toggle');
            if (!insideMenu && !isToggle) {
                try { window._openQuickMenu.style.display = 'none'; } catch(e) {}
                window._openQuickMenu = null;
            }
        }
    });
});

// ---------- Auth + Profile UI ----------
function showLogin() {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.getElementById('login-screen').classList.add('active');
}

function showRegister() {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.getElementById('register-screen').classList.add('active');
}

function registerUser() {
    const ced = (document.getElementById('reg-cedula')||{}).value || '';
    const clave = (document.getElementById('reg-clave')||{}).value || '';
    const nombre = (document.getElementById('reg-nombre')||{}).value || '';
    const salario = Number((document.getElementById('reg-salario')||{}).value || 0);
    if (!ced || !clave || !nombre || !salario) { alert('Completa todos los campos.'); return; }
    const usersJson = localStorage.getItem('nomina_users') || '{}';
    let users = {};
    try { users = JSON.parse(usersJson); } catch(e) { users = {}; }
    if (users[ced]) { alert('Ya existe un usuario con esa cédula.'); return; }
    const userObj = { cedula: ced, clave: clave, nombre: nombre, salario: Math.round(salario), diasConfig: {} };
    users[ced] = userObj;
    localStorage.setItem('nomina_users', JSON.stringify(users));
    localStorage.setItem('nomina_current', ced);
    currentUser = ced;
    db = userObj;
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    loadUserList();
    showMainUI();
}

function loginUser() {
    const ced = (document.getElementById('login-cedula')||{}).value || '';
    const clave = (document.getElementById('login-clave')||{}).value || '';
    if (!ced || !clave) { alert('Ingresa cédula y clave.'); return; }
    const usersJson = localStorage.getItem('nomina_users') || '{}';
    let users = {};
    try { users = JSON.parse(usersJson); } catch(e) { users = {}; }
    const u = users[ced];
    if (!u || u.clave !== clave) { alert('Credenciales inválidas.'); return; }
    currentUser = ced;
    localStorage.setItem('nomina_current', ced);
    db = u;
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    showMainUI();
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('nomina_current');
    // show login
    showLogin();
    // reset profile area
    const pa = document.getElementById('profile-area'); if (pa) pa.innerHTML = `<button id="btn-login" class="btn" onclick="showLogin()">Iniciar sesión</button>`;
}

function showMainUI() {
    // Update profile area
    const pa = document.getElementById('profile-area');
    if (pa) {
        pa.innerHTML = `
            <div class="profile-btn" id="profile-btn">${db.nombre || ''} ▾</div>
            <div class="profile-menu" id="profile-menu" style="display:none">
                <button onclick="editProfile()">Editar perfil</button>
                <button onclick="viewResumen()">Ver resumen</button>
                <button onclick="configureCalendar()">Configurar calendario</button>
                <button onclick="logoutUser()">Cerrar sesión</button>
            </div>
        `;
        const btn = document.getElementById('profile-btn');
        const menu = document.getElementById('profile-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => { menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; });
        }
    }
    // show calendar
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('register-screen').classList.remove('active');
    irAPaso(2);
}

function editProfile() {
    // open the profile modal
    const modal = document.getElementById('modal-profile');
    if (!modal) return;
    const nombreIn = document.getElementById('profile-nombre');
    const salarioIn = document.getElementById('profile-salario');
    const claveIn = document.getElementById('profile-clave');
    if (nombreIn) nombreIn.value = db.nombre || '';
    if (salarioIn) salarioIn.value = db.salario || 0;
    if (claveIn) claveIn.value = '';
    modal.style.display = 'flex';
}

function saveProfileModal() {
    const nombreIn = document.getElementById('profile-nombre');
    const salarioIn = document.getElementById('profile-salario');
    const claveIn = document.getElementById('profile-clave');
    if (!nombreIn || !salarioIn) return;
    const nuevoNombre = nombreIn.value.trim();
    const nuevoSalario = Math.round(Number(salarioIn.value) || db.salario);
    const nuevaClave = claveIn.value || '';
    if (!nuevoNombre || !nuevoSalario) { alert('Nombre y salario son requeridos.'); return; }
    db.nombre = nuevoNombre;
    db.salario = nuevoSalario;
    if (nuevaClave) db.clave = nuevaClave;
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    const usersJson = localStorage.getItem('nomina_users') || '{}';
    try { const users = JSON.parse(usersJson); if (currentUser) { users[currentUser] = db; localStorage.setItem('nomina_users', JSON.stringify(users)); } } catch(e) {}
    closeProfileModal();
    showMainUI();
}

function closeProfileModal() {
    const modal = document.getElementById('modal-profile'); if (!modal) return; modal.style.display = 'none';
}

function viewResumen() { irAPaso(3); const menu = document.getElementById('profile-menu'); if (menu) menu.style.display='none'; }
function configureCalendar() { irAPaso(2); const menu = document.getElementById('profile-menu'); if (menu) menu.style.display='none'; }

function loadUserList() {
    const sel = document.getElementById('user-list');
    if (!sel) return;
    sel.innerHTML = '';
    const usersJson = localStorage.getItem('nomina_users') || '{}';
    let users = {};
    try { users = JSON.parse(usersJson); } catch(e) { users = {}; }
    const emptyOpt = document.createElement('option'); emptyOpt.value=''; emptyOpt.innerText='(seleccionar)'; sel.appendChild(emptyOpt);
    Object.keys(users).forEach(u => {
        const opt = document.createElement('option'); opt.value = u; opt.innerText = u; sel.appendChild(opt);
    });
}

function crearUsuario() {
    const uname = document.getElementById('usuario').value.trim();
    if (!uname) { alert('Ingresa un nombre de usuario.'); return; }
    const usersJson = localStorage.getItem('nomina_users') || '{}';
    let users = {};
    try { users = JSON.parse(usersJson); } catch(e) { users = {}; }
    users[uname] = db;
    localStorage.setItem('nomina_users', JSON.stringify(users));
    loadUserList();
    alert('Usuario creado y datos guardados localmente.');
}

function cargarUsuario() {
    const sel = document.getElementById('user-list');
    if (!sel) return;
    const uname = sel.value;
    if (!uname) { alert('Selecciona un usuario.'); return; }
    const usersJson = localStorage.getItem('nomina_users') || '{}';
    let users = {};
    try { users = JSON.parse(usersJson); } catch(e) { users = {}; }
    if (!users[uname]) { alert('Usuario no encontrado'); return; }
    db = users[uname];
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    // Prefill inputs
    const nombreEl = document.getElementById('nombre');
    const salarioEl = document.getElementById('salario');
    if (nombreEl) nombreEl.value = db.nombre || '';
    if (salarioEl) salarioEl.value = db.salario || '';
    alert('Usuario cargado. Revisa tus datos y configura el calendario.');
}

function irAPaso(p) {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.getElementById(`step-${p}`).classList.add('active');
    if (p === 2) renderCalendar();
    if (p === 3) calcularResumen();
}

function calcularResumen() {
    const resumen = (typeof window.calculatePayrollSummary === 'function') ? window.calculatePayrollSummary(currentYear, currentMonth, db) : null;
    const cont = document.getElementById('resumen-final');
    if (!cont || !resumen) return;
    cont.innerHTML = `
        <h3>Resumen ${new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth, 1))}</h3>
        <p>Salario base: ${Number(db.salario||0).toLocaleString('es-CO', { style:'currency', currency:'COP' })}</p>
        <p>Total recargos: ${Math.round(resumen.totalRecargos || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })}</p>
        <p>Total extras (valor): ${Math.round(resumen.totalExtras || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })} · Cantidad de horas: ${Math.round(resumen.totalExtrasCount || 0)}h</p>
        <p>Bruto (salario + recargos + extras): ${Math.round(resumen.brutoMensual || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })}</p>
        <p>Incluye auxilio transporte: ${resumen.incluyeAux ? 'Sí' : 'No'}</p>
        <p>IBC (base para aportes): ${Math.round(resumen.ibc || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })}</p>
        <p>Salud: ${Math.round(resumen.salud || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })} · Pensión: ${Math.round(resumen.pension || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })}</p>
        <p><strong>Neto a pagar: ${Math.round(resumen.neto || 0).toLocaleString('es-CO', { style:'currency', currency:'COP' })}</strong></p>
    `;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    // Close any open quick menu to avoid detached references when re-rendering
    if (window._openQuickMenu) {
        try { window._openQuickMenu.remove(); } catch(e) { try { window._openQuickMenu.style.display='none'; } catch{} }
        window._openQuickMenu = null;
    }
    grid.innerHTML = '';

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun .. 6 = Sat
    const startIndex = (firstDay + 6) % 7; // ajustar para semana que inicia en LUN

    // Mostrar mes en el encabezado
    const mesLabel = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth, 1));
    document.getElementById('mes-label').innerText = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

    // celdas vacías para alinear el primer día
    for (let i = 0; i < startIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell empty-cell';
        grid.appendChild(empty);
    }

    // Generar días dinámicamente
    for (let i = 1; i <= daysInMonth; i++) {
        const fecha = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const utcDay = new Date(Date.UTC(currentYear, currentMonth, i)).getUTCDay();
        const esFest = (window.FESTIVOS_2026 || []).includes(fecha) || utcDay === 0; // domingo como festivo en UI

        const cell = document.createElement('div');
        cell.className = `day-cell ${esFest ? 'festivo' : ''}`;

        const conf = db.diasConfig[fecha] || { turno: null, extras: 0 };
        let tagHtml = '';
        if (conf.turno) {
            let tagClass = conf.turno === 'vacaciones' ? 'tag-vac' : (conf.turno === 'descanso' ? 'tag-rest' : 'tag-work');
            tagHtml = `<div class="event-tag ${tagClass}">${conf.turno.toUpperCase()}</div>`;
            if (conf.extras > 0) tagHtml += `<div class="event-tag" style="background:#fef3c7; color:#92400e">+${conf.extras}h Extra</div>`;
        }

        cell.innerHTML = `
            <span class="day-number">${i}</span>
            ${tagHtml}
            <button class="quick-toggle" data-fecha="${fecha}" aria-label="Abrir opciones">+</button>
            <div class="quick-menu" data-fecha="${fecha}" style="display:none">
                <label class="qm-row">Turno:
                    <div class="cs-select">
                        <div class="cs-trigger" data-value="descanso">Descanso</div>
                        <div class="cs-options" role="listbox" aria-hidden="true">
                            <div class="cs-option" data-value="descanso">Descanso</div>
                            <div class="cs-option" data-value="am">Mañana</div>
                            <div class="cs-option" data-value="pm">Tarde</div>
                            <div class="cs-option" data-value="nocturno">Noche</div>
                            <div class="cs-option" data-value="vacaciones">Vacaciones</div>
                        </div>
                    </div>
                </label>
                <label class="qm-row">Horas extras:
                    <input class="qm-extras" type="number" min="0" step="0.25">
                </label>
                <div class="qm-summary" aria-live="polite"></div>
                <div class="qm-actions">
                    <button class="qm-edit" type="button">Editar</button>
                    <button class="qm-close">Cerrar</button>
                </div>
            </div>
        `;

        // Only open modal via the Edit button in the quick-menu; do not open modal by clicking the whole cell
        grid.appendChild(cell);

        const toggle = cell.querySelector('.quick-toggle');
        const menu = cell.querySelector('.quick-menu');
        const select = cell.querySelector('.qm-select');
        const csSelect = cell.querySelector('.cs-select');
        const csTrigger = cell.querySelector('.cs-trigger');
        const csOptions = cell.querySelector('.cs-options');
        const extrasInput = cell.querySelector('.qm-extras');
        const closeBtn = cell.querySelector('.qm-close');
        const summaryEl = cell.querySelector('.qm-summary');
        const editBtn = cell.querySelector('.qm-edit');

        // set current values
        if (csTrigger) {
            const txt = (conf.turno && ({'descanso':'Descanso','am':'Mañana','pm':'Tarde','nocturno':'Noche','vacaciones':'Vacaciones'})[conf.turno]) || 'Descanso';
            csTrigger.dataset.value = conf.turno || 'descanso';
            csTrigger.textContent = txt;
        }
        if (extrasInput) extrasInput.value = conf.extras || 0;

        if (toggle && menu) {
            toggle.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const opened = menu.style.display !== 'flex';
                // close other open menu
                if (window._openQuickMenu && window._openQuickMenu !== menu) {
                    try { window._openQuickMenu.remove(); } catch(e) { try { window._openQuickMenu.style.display = 'none'; } catch{} }
                    window._openQuickMenu = null;
                }
                if (opened) {
                    // move menu to body so it's not clipped by calendar grid
                    try {
                        if (menu.parentNode !== document.body) document.body.appendChild(menu);
                    } catch(e) {}
                    menu.style.display = 'flex';
                    // trigger animation
                    menu.classList.add('open');
                    updateMenuSummary(fecha, select, extrasInput, summaryEl);
                    positionMenu(menu, toggle);
                    window._openQuickMenu = menu;
                } else {
                    // hide and remove from body (with animation class removed)
                    try { menu.classList.remove('open'); menu.style.display = 'none'; menu.remove(); } catch(e) { try { menu.style.display='none'; } catch{} }
                    window._openQuickMenu = null;
                }
            });
        }

        // custom select interactions
        if (csTrigger && csOptions) {
            // open/close options
            csTrigger.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const opened = csOptions.style.display === 'block';
                // close any other cs-options
                document.querySelectorAll('.cs-options').forEach(o => { if (o !== csOptions) o.style.display = 'none'; });
                csOptions.style.display = opened ? 'none' : 'block';
                csOptions.setAttribute('aria-hidden', opened ? 'true' : 'false');
            });
            // option selection
            csOptions.querySelectorAll('.cs-option').forEach(opt => {
                opt.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const val = opt.dataset.value;
                    csTrigger.dataset.value = val;
                    csTrigger.textContent = opt.textContent;
                    csOptions.style.display = 'none';
                    // save change
                    const extras = extrasInput ? (parseFloat(extrasInput.value) || 0) : 0;
                    saveConfigForDate(fecha, val, extras);
                    updateMenuSummary(fecha, csTrigger, extrasInput, summaryEl);
                });
            });
        }

        if (extrasInput) {
            // debounce helper
            let saveTimer = null;
            const scheduleSave = () => {
                if (saveTimer) clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    const turno = select ? select.value : 'descanso';
                    const extras = parseFloat(extrasInput.value) || 0;
                    saveConfigForDate(fecha, turno, extras);
                }, 300);
            };
            extrasInput.addEventListener('input', (ev) => {
                updateMenuSummary(fecha, select, extrasInput, summaryEl);
                scheduleSave();
            });
            extrasInput.addEventListener('blur', (ev) => {
                const turno = select ? select.value : 'descanso';
                const extras = parseFloat(ev.target.value) || 0;
                if (saveTimer) clearTimeout(saveTimer);
                saveConfigForDate(fecha, turno, extras);
                updateMenuSummary(fecha, select, extrasInput, summaryEl);
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', (ev) => { ev.stopPropagation(); try { menu.classList.remove('open'); menu.style.display='none'; menu.remove(); } catch(e){ try{ menu.style.display='none'; }catch{} } window._openQuickMenu = null; });
        if (editBtn) editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); try { menu.classList.remove('open'); menu.style.display='none'; menu.remove(); } catch(e){ try{ menu.style.display='none'; }catch{} } window._openQuickMenu = null; abrirModal(fecha); });
    }
}

function saveConfigForDate(fecha, turno, extras) {
    db.diasConfig[fecha] = { turno: turno || 'descanso', extras: Number(extras) || 0 };
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    renderCalendar();
}

function positionMenu(menuEl, toggleEl) {
    if (!menuEl || !toggleEl) return;
    // reset to measure
    menuEl.style.left = '';
    menuEl.style.right = '';
    menuEl.style.top = '';

    const menuRect = menuEl.getBoundingClientRect();
    const toggleRect = toggleEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // prefer to show below toggle
    let top = toggleRect.bottom + 6;
    let left = toggleRect.left;

    // if would overflow right, align to right edge
    if (left + menuRect.width > vw - 8) {
        left = Math.max(8, vw - menuRect.width - 8);
    }
    // if would overflow bottom, show above toggle
    if (top + menuRect.height > vh - 8) {
        top = toggleRect.top - menuRect.height - 6;
        if (top < 8) top = 8;
    }

    menuEl.style.position = 'fixed';
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
}

function updateMenuSummary(fecha, selectEl, extrasEl, summaryEl) {
    if (!summaryEl) return;
    // determine turno value from either a native select or our custom trigger
    let turno = 'descanso';
    if (selectEl) {
        if (selectEl.tagName === 'SELECT') turno = selectEl.value;
        else if (selectEl.dataset && selectEl.dataset.value) turno = selectEl.dataset.value;
        else if (selectEl.querySelector) {
            const t = selectEl.querySelector('.cs-trigger');
            if (t && t.dataset && t.dataset.value) turno = t.dataset.value;
        }
    } else {
        turno = db.diasConfig[fecha] ? db.diasConfig[fecha].turno : 'descanso';
    }
    const extras = extrasEl ? (parseFloat(extrasEl.value) || 0) : (db.diasConfig[fecha] ? db.diasConfig[fecha].extras : 0);
    const pago = (typeof window.calculateDayPayment === 'function') ? window.calculateDayPayment(fecha, { turno, extras }, db.salario || 0) : null;
    if (pago) {
        const bruto = Math.round(pago.brutoDia);
        const baseH = typeof pago.baseH !== 'undefined' ? pago.baseH : ((typeof window.baseHoursForTurno === 'function') ? window.baseHoursForTurno(turno) : 0);
        const valorHoraBase = Number(pago.hourly);
        const valorHoraEfectiva = typeof pago.effectiveHourly !== 'undefined' ? Number(pago.effectiveHourly) : valorHoraBase;
        const valorHoraBaseFmt = valorHoraBase.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const valorHoraEfectivaFmt = valorHoraEfectiva.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const brutoFmt = bruto.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
        // Show both base hourly and effective hourly (with recargos) when different
        const horaLine = (valorHoraBase !== valorHoraEfectiva)
            ? `<div>Valor hora: ${valorHoraBaseFmt} → <strong>${valorHoraEfectivaFmt}</strong></div>`
            : `<div>Valor hora: <strong>${valorHoraBaseFmt}</strong></div>`;
        summaryEl.innerHTML = `
            ${horaLine}
            <div>Horas base: ${baseH}h</div>
            <div>Bruto estimado: <strong>${brutoFmt}</strong></div>
        `;
    } else {
        summaryEl.innerText = '';
    }
}

function cambiarMes(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
    if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
    renderCalendar();
}

function abrirModal(f) {
    diaSeleccionado = f;
    document.getElementById('modal-date-title').innerText = f;
    const conf = db.diasConfig[f] || { turno: 'descanso', extras: 0 };
    const select = document.getElementById('select-turno');
    const extras = document.getElementById('input-extras');
    if (select) select.value = conf.turno;
    if (extras) extras.value = conf.extras;

    // Añadir listeners para guardado automático
    if (select) {
        select.removeEventListener('change', handleSelectChange);
        select.addEventListener('change', handleSelectChange);
    }
    if (extras) {
        extras.removeEventListener('blur', handleExtrasBlur);
        extras.addEventListener('blur', handleExtrasBlur);
    }

    document.getElementById('modal-dia').style.display = 'flex';
}

function guardarDia() {
    // guardado explícito y cierre
    const select = document.getElementById('select-turno');
    const extras = document.getElementById('input-extras');
    db.diasConfig[diaSeleccionado] = {
        turno: select ? select.value : 'descanso',
        extras: extras ? (parseFloat(extras.value) || 0) : 0
    };
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    cerrarModal();
    renderCalendar();
}

function cerrarModal() {
    const select = document.getElementById('select-turno');
    const extras = document.getElementById('input-extras');
    if (select) select.removeEventListener('change', handleSelectChange);
    if (extras) extras.removeEventListener('blur', handleExtrasBlur);
    document.getElementById('modal-dia').style.display = 'none';
}

// Guardado automático: utilidades
function guardarDiaAuto() {
    if (!diaSeleccionado) return;
    const select = document.getElementById('select-turno');
    const extras = document.getElementById('input-extras');
    const turno = select ? select.value : 'descanso';
    const horas = extras ? (parseFloat(extras.value) || 0) : 0;
    db.diasConfig[diaSeleccionado] = { turno, extras: horas };
    localStorage.setItem('nomina_v4', JSON.stringify(db));
    renderCalendar();
}

function handleSelectChange() { guardarDiaAuto(); }
function handleExtrasBlur() { guardarDiaAuto(); }

// -------------------- Generar PDF --------------------
function generarPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('jsPDF no está disponible.'); return; }

    const resumen = (typeof window.calculatePayrollSummary === 'function') ? window.calculatePayrollSummary(currentYear, currentMonth, db) : { rows: [], totalExtras:0, salud:0, pension:0, descuentos:0, neto:0 };

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Desprendible de Pago - NóminaPro', 14, 20);
    doc.setFontSize(10);
    doc.text(`Empleado: ${db.nombre || '-'}`, 14, 28);
    doc.text(`Periodo: ${new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth, 1))}`, 14, 34);

    // Resumen superior (formato moneda COP)
    const salarioFmt = Number(db.salario || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    const extrasFmt = Math.round(resumen.totalExtras).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    const extrasCount = Math.round(resumen.totalExtrasCount || 0);
    const saludFmt = Math.round(resumen.salud).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    const pensionFmt = Math.round(resumen.pension).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    const descuentosFmt = Math.round(resumen.descuentos).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    const netoFmt = Math.round(resumen.neto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

    doc.text(`Salario base: ${salarioFmt}`, 14, 44);
    doc.text(`Total extras: ${extrasFmt} (${extrasCount}h)`, 14, 50);
    doc.text(`Descuentos (Salud ${saludFmt}, Pensión ${pensionFmt}): ${descuentosFmt}`, 14, 56);
    doc.text(`Neto a pagar: ${netoFmt}`, 14, 62);

    // Tabla de días
    const head = [['Fecha','Turno','Horas Extras','Bruto Día','Festivo']];
    const body = resumen.rows.map(r => [
        r.fecha,
        r.turno,
        r.extras.toString(),
        Math.round(r.brutoDia).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }),
        r.esFest ? 'Sí' : 'No'
    ]);

    if (doc.autoTable) {
        doc.autoTable({ startY: 70, head: head, body: body, styles: { fontSize: 8 } });
    } else {
        let y = 70;
        doc.setFontSize(9);
        body.forEach(row => {
            doc.text(row.join('  |  '), 14, y);
            y += 6;
            if (y > 280) { doc.addPage(); y = 20; }
        });
    }

    const fileName = `nomina_${(db.nombre||'empleado').replace(/\s+/g,'_')}_${currentYear}-${(currentMonth+1).toString().padStart(2,'0')}.pdf`;
    doc.save(fileName);
}