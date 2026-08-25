/* ============================================================
   Grand Aurora — Panel de Administración · Demo Plan Premium
   Usa la capa de datos compartida (window.GA).
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const db = GA.db;

  const SESSION_KEY = 'grandaurora_session';
  const STAFF = ['Rosa Méndez', 'Carlos Fuentes', 'Ana Rojas', 'Luis Paredes'];
  const MODULE_TITLES = {
    dashboard: 'Dashboard', habitaciones: 'Habitaciones', limpieza: 'Limpieza',
    reservas: 'Reservas', servicio: 'Servicio al cuarto', tarifas: 'Tarifas y temporadas',
    paquetes: 'Paquetes y descuentos', canales: 'Canales de venta', config: 'Configuración'
  };

  /* ================= Toasts ================= */
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ================= Modal de confirmación ================= */
  function confirmAction(title, text, onOk) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#modalConfirm').hidden = false;
    const ok = $('#confirmOk');
    const handler = () => { ok.removeEventListener('click', handler); $('#modalConfirm').hidden = true; onOk(); };
    ok.addEventListener('click', handler);
  }
  $$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('.modal').hidden = true));

  /* ================= Login ================= */
  function isLogged() { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } }
  function showApp() {
    $('#loginScreen').hidden = true;
    $('#app').hidden = false;
    renderAll();
  }
  function showLogin() {
    $('#app').hidden = true;
    $('#loginScreen').hidden = false;
  }
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = $('#lgUser').value.trim(), p = $('#lgPass').value;
    if (u === 'admin' && p === 'demo123') {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (err) {}
      $('#lgError').textContent = '';
      showApp();
    } else {
      $('#lgError').textContent = 'Usuario o contraseña incorrectos.';
    }
  });
  $('#btnLogout').addEventListener('click', () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    showLogin();
  });

  /* ================= Navegación entre módulos ================= */
  $$('.side-link[data-module]').forEach(btn => btn.addEventListener('click', () => {
    $$('.side-link[data-module]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mod = btn.dataset.module;
    $$('.module').forEach(m => m.classList.remove('active'));
    $('#mod-' + mod).classList.add('active');
    $('#moduleTitle').textContent = MODULE_TITLES[mod] || mod;
    $('#sidebar').classList.remove('open');
    renderModule(mod);
  }));
  $('#hambAdmin').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  /* ================= Topbar: reloj + ocupación ================= */
  function tickClock() {
    const d = new Date();
    $('#topbarDate').textContent = d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + d.toTimeString().slice(0, 5);
  }
  setInterval(tickClock, 30000); tickClock();

  function occupancy() {
    const occ = db.rooms.filter(r => r.status === 'ocupada').length;
    return Math.round(occ / db.rooms.length * 100);
  }

  /* ============================================================
     RENDERIZADO POR MÓDULO
     ============================================================ */
  function renderModule(mod) {
    ({ dashboard: renderDashboard, habitaciones: renderRooms, limpieza: renderTasks,
       reservas: renderReservations, servicio: renderOrders, tarifas: renderRates,
       paquetes: renderPromos, canales: renderChannels, config: renderSettings }[mod] || function () {})();
    renderBadges();
  }
  function renderAll() { Object.keys(MODULE_TITLES).forEach(renderModule); }

  function renderBadges() {
    $('#chipOcc').textContent = 'Ocupación: ' + occupancy() + '%';
    const pend = db.orders.filter(o => o.status === 'pendiente').length;
    const badge = $('#badgeOrders');
    badge.hidden = pend === 0;
    badge.textContent = pend;
  }

  /* ================= DASHBOARD ================= */
  function renderDashboard() {
    const hoy = GA.todayISO();
    const mesActual = hoy.slice(0, 7);
    const activas = db.reservations.filter(r => r.status === 'confirmada' || r.status === 'checkin');
    const ingresosMes = db.reservations
      .filter(r => r.status !== 'cancelada' && r.checkin.slice(0, 7) === mesActual)
      .reduce((s, r) => s + r.total, 0);
    const limpPend = db.tasks.filter(t => t.status !== 'terminada').length;

    $('#kpis').innerHTML = [
      ['Ocupación hoy', occupancy() + '%', db.rooms.filter(r => r.status === 'ocupada').length + ' de ' + db.rooms.length + ' habitaciones'],
      ['Ingresos del mes', GA.fmtMoney(ingresosMes), 'reservas con llegada este mes'],
      ['Reservas activas', activas.length, 'confirmadas + con check-in'],
      ['Limpiezas pendientes', limpPend, 'tareas sin completar']
    ].map(k => `<div class="kpi"><span>${k[0]}</span><b>${k[1]}</b><small>${k[2]}</small></div>`).join('');

    // Gráfico de barras SVG: ingresos últimos 7 días
    const days = [];
    for (let i = 6; i >= 0; i--) days.push(GA.addDays(hoy, -i));
    const values = days.map(d => db.reservations
      .filter(r => r.status !== 'cancelada' && r.checkin === d)
      .reduce((s, r) => s + r.total, 0));
    const max = Math.max(1, ...values);
    const W = 520, H = 200, padL = 8, padB = 26, padT = 22;
    const bw = (W - padL * 2) / 7;
    const bars = days.map((d, i) => {
      const h = Math.round((H - padT - padB) * values[i] / max);
      const x = padL + i * bw + 6, y = H - padB - h;
      const day = new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short' });
      const val = values[i] ? Math.round(values[i] / 1000) + ' mil' : '0';
      return `<rect class="bar" x="${x}" y="${y}" width="${bw - 12}" height="${h}" rx="5"/>
        <text class="val" x="${x + (bw - 12) / 2}" y="${y - 6}" text-anchor="middle">${val}</text>
        <text class="lbl" x="${x + (bw - 12) / 2}" y="${H - 8}" text-anchor="middle">${day}</text>`;
    }).join('');
    $('#chartRevenue').innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos de los últimos 7 días">
        <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#C9A24B"/><stop offset="1" stop-color="#A16207"/>
        </linearGradient></defs>${bars}</svg>`;

    // Llegadas y salidas de hoy
    const arrivals = db.reservations.filter(r => r.checkin === hoy && r.status === 'confirmada');
    const departures = db.reservations.filter(r => r.checkout === hoy && r.status === 'checkin');
    $('#listArrivals').innerHTML = arrivals.length
      ? arrivals.map(r => `<li><span><b>${r.guest}</b> — ${db.roomTypes[r.type].name}</span><span class="badge b-confirmada">${r.code}</span></li>`).join('')
      : '<li class="empty">Sin llegadas programadas para hoy.</li>';
    $('#listDepartures').innerHTML = departures.length
      ? departures.map(r => `<li><span><b>${r.guest}</b> — hab. ${r.room || '—'}</span><span class="badge b-checkin">${r.code}</span></li>`).join('')
      : '<li class="empty">Sin salidas programadas para hoy.</li>';

    // Actividad
    $('#feedActivity').innerHTML = db.activity.slice(0, 10).map(a =>
      `<li><span>${a.text}</span><time>${new Date(a.time).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></li>`).join('');
  }

  /* ================= HABITACIONES ================= */
  const STATUS_LABELS = { disponible: 'Disponible', ocupada: 'Ocupada', limpieza: 'Limpieza', mantenimiento: 'Mantenimiento' };
  let currentRoom = null;

  function renderRooms() {
    const counts = { disponible: 0, ocupada: 0, limpieza: 0, mantenimiento: 0 };
    db.rooms.forEach(r => counts[r.status]++);
    $('#roomCounters').innerHTML = Object.keys(counts).map(s =>
      `<span class="counter" style="border-color:var(--${s === 'disponible' ? 'green' : s === 'ocupada' ? 'blue' : s === 'limpieza' ? 'amber' : 'gray'})">${STATUS_LABELS[s]}: <b>${counts[s]}</b></span>`).join('');

    const fStatus = $('#filterStatus').value, fFloor = $('#filterFloor').value;
    const rooms = db.rooms.filter(r => (!fStatus || r.status === fStatus) && (!fFloor || String(r.floor) === fFloor));
    $('#roomsGrid').innerHTML = rooms.map(r => `
      <button class="room-card st-${r.status}" data-room="${r.number}">
        <b>${r.number}</b>
        <span class="rc-type">${db.roomTypes[r.type].name} · Piso ${r.floor}</span>
        ${r.guest ? `<span class="rc-guest">${r.guest}</span>` : ''}
        <span class="rc-status">${STATUS_LABELS[r.status]}</span>
      </button>`).join('') || '<p class="empty-note">Sin habitaciones para el filtro seleccionado.</p>';

    $$('#roomsGrid .room-card').forEach(card => card.addEventListener('click', () => openRoomModal(parseInt(card.dataset.room, 10))));
  }
  $('#filterStatus').addEventListener('change', renderRooms);
  $('#filterFloor').addEventListener('change', renderRooms);

  function openRoomModal(num) {
    currentRoom = db.rooms.find(r => r.number === num);
    $('#modalRoomTitle').textContent = 'Habitación ' + num;
    $('#modalRoomInfo').textContent = db.roomTypes[currentRoom.type].name + ' · Estado actual: ' + STATUS_LABELS[currentRoom.status] + (currentRoom.guest ? ' · Huésped: ' + currentRoom.guest : '');
    $('#roomNote').value = currentRoom.note || '';
    $('#fieldGuest').hidden = true;
    $('#roomGuest').value = '';
    $('#statusBtns').innerHTML = Object.keys(STATUS_LABELS)
      .filter(s => s !== currentRoom.status)
      .map(s => `<button class="sb-${s}" data-status="${s}">${STATUS_LABELS[s]}</button>`).join('');
    $$('#statusBtns button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.status === 'ocupada') {
        $('#fieldGuest').hidden = false;
        $('#roomGuest').focus();
        $$('#statusBtns button').forEach(x => x.disabled = true);
        b.disabled = false;
        b.textContent = 'Confirmar ocupación';
        b.onclick = () => changeRoomStatus(num, 'ocupada');
      } else {
        changeRoomStatus(num, b.dataset.status);
      }
    }));
    $('#modalRoom').hidden = false;
  }

  function changeRoomStatus(num, newStatus) {
    const room = db.rooms.find(r => r.number === num);
    const prev = room.status;
    if (newStatus === 'ocupada') {
      const guest = $('#roomGuest').value.trim();
      if (!guest) { toast('Ingresa el nombre del huésped.', 'error'); return; }
      room.guest = guest;
    }
    if (newStatus === 'disponible') room.guest = null;
    room.status = newStatus;
    room.note = $('#roomNote').value.trim();

    if (newStatus === 'limpieza' && prev !== 'limpieza') {
      db.tasks.unshift({ id: 'TK-' + Date.now().toString(36).toUpperCase(), room: num, priority: 'media', assignee: null, status: 'pendiente', note: 'Generada desde cambio de estado' });
    }
    GA.logActivity('Habitación ' + num + ': ' + STATUS_LABELS[prev] + ' → ' + STATUS_LABELS[newStatus]);
    GA.save();
    $('#modalRoom').hidden = true;
    toast('Habitación ' + num + ' ahora está en "' + STATUS_LABELS[newStatus] + '".');
    renderRooms(); renderBadges();
  }

  /* ================= LIMPIEZA ================= */
  function renderTasks() {
    const cols = { pendiente: '#colPend', proceso: '#colProc', terminada: '#colTerm' };
    Object.values(cols).forEach(sel => $(sel).innerHTML = '');
    db.tasks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div class="t-head"><b>Hab. ${t.room}</b><span class="prio prio-${t.priority}">${t.priority}</span></div>
        ${t.note ? `<p class="t-note">${t.note}</p>` : ''}
        <select aria-label="Asignar camarista">
          <option value="">Sin asignar</option>
          ${STAFF.map(s => `<option ${t.assignee === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <div class="t-actions">
          ${t.status === 'pendiente' ? '<button class="btn-mini warn" data-start>Iniciar</button>' : ''}
          ${t.status === 'proceso' ? '<button class="btn-mini primary" data-done>Completar</button>' : ''}
        </div>`;
      card.querySelector('select').addEventListener('change', e => {
        t.assignee = e.target.value || null;
        GA.save(); toast('Tarea de hab. ' + t.room + ' asignada.');
      });
      const startBtn = card.querySelector('[data-start]');
      if (startBtn) startBtn.addEventListener('click', () => {
        t.status = 'proceso'; GA.logActivity('Limpieza iniciada en hab. ' + t.room); GA.save(); renderTasks();
      });
      const doneBtn = card.querySelector('[data-done]');
      if (doneBtn) doneBtn.addEventListener('click', () => {
        t.status = 'terminada';
        const room = db.rooms.find(r => r.number === t.room);
        if (room && room.status === 'limpieza') { room.status = 'disponible'; }
        GA.logActivity('Limpieza terminada en hab. ' + t.room + ' — habitación disponible');
        GA.save(); renderTasks(); renderBadges(); toast('Habitación ' + t.room + ' limpia y disponible.');
      });
      $(cols[t.status]).appendChild(card);
    });
    $('#countPend').textContent = db.tasks.filter(t => t.status === 'pendiente').length;
    $('#countProc').textContent = db.tasks.filter(t => t.status === 'proceso').length;
    $('#countTerm').textContent = db.tasks.filter(t => t.status === 'terminada').length;
  }

  $('#btnNewTask').addEventListener('click', () => {
    $('#ntRoom').innerHTML = db.rooms.map(r => `<option value="${r.number}">Habitación ${r.number}</option>`).join('');
    $('#ntNote').value = '';
    $('#modalTask').hidden = false;
  });
  $('#ntCreate').addEventListener('click', () => {
    db.tasks.unshift({
      id: 'TK-' + Date.now().toString(36).toUpperCase(),
      room: parseInt($('#ntRoom').value, 10),
      priority: $('#ntPriority').value,
      assignee: null, status: 'pendiente',
      note: $('#ntNote').value.trim()
    });
    GA.logActivity('Nueva tarea de limpieza creada (hab. ' + $('#ntRoom').value + ')');
    GA.save();
    $('#modalTask').hidden = true;
    renderTasks(); toast('Tarea creada.');
  });

  /* ================= RESERVAS ================= */
  function renderReservations() {
    const filter = $('#filterResStatus').value;
    const list = db.reservations
      .filter(r => !filter || r.status === filter)
      .sort((a, b) => a.checkin.localeCompare(b.checkin));
    const channelName = id => (db.channels.find(c => c.id === id) || { name: id === 'web' ? 'Web directa' : id }).name;

    $('#tbodyRes').innerHTML = list.map(r => `
      <tr>
        <td><b>${r.code}</b></td>
        <td>${r.guest}</td>
        <td>${db.roomTypes[r.type].name}${r.room ? ' · hab. ' + r.room : ''}</td>
        <td>${GA.fmtDate(r.checkin)}</td>
        <td>${GA.fmtDate(r.checkout)}</td>
        <td>${channelName(r.channel)}</td>
        <td><span class="badge b-${r.status}">${r.status === 'checkin' ? 'Check-in' : r.status === 'checkout' ? 'Check-out' : r.status}</span></td>
        <td>${GA.fmtMoney(r.total)}</td>
        <td><div class="row-actions">
          ${r.status === 'confirmada' ? `<button class="btn-mini primary" data-checkin="${r.code}">Check-in</button><button class="btn-mini danger" data-cancel="${r.code}">Cancelar</button>` : ''}
          ${r.status === 'checkin' ? `<button class="btn-mini warn" data-checkout="${r.code}">Check-out</button>` : ''}
        </div></td>
      </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--muted)">Sin reservas para el filtro seleccionado.</td></tr>';

    $$('[data-checkin]').forEach(b => b.addEventListener('click', () => doCheckin(b.dataset.checkin)));
    $$('[data-checkout]').forEach(b => b.addEventListener('click', () => doCheckout(b.dataset.checkout)));
    $$('[data-cancel]').forEach(b => b.addEventListener('click', () =>
      confirmAction('Cancelar reserva', '¿Cancelar la reserva ' + b.dataset.cancel + '? Las fechas quedarán liberadas.', () => {
        const r = db.reservations.find(x => x.code === b.dataset.cancel);
        r.status = 'cancelada';
        GA.logActivity('Reserva ' + r.code + ' cancelada');
        GA.save(); renderReservations(); renderBadges(); toast('Reserva cancelada.');
      })
    ));
  }
  $('#filterResStatus').addEventListener('change', renderReservations);

  function doCheckin(code) {
    const r = db.reservations.find(x => x.code === code);
    const free = db.rooms.find(x => x.type === r.type && x.status === 'disponible');
    if (!free) { toast('No hay habitaciones disponibles del tipo ' + db.roomTypes[r.type].name + '.', 'error'); return; }
    free.status = 'ocupada'; free.guest = r.guest;
    r.status = 'checkin'; r.room = free.number;
    GA.logActivity('Check-in de ' + r.guest + ' en hab. ' + free.number + ' (' + code + ')');
    GA.save(); renderReservations(); renderBadges();
    toast('Check-in realizado: ' + r.guest + ' → habitación ' + free.number + '.');
  }
  function doCheckout(code) {
    const r = db.reservations.find(x => x.code === code);
    r.status = 'checkout';
    if (r.room) {
      const room = db.rooms.find(x => x.number === r.room);
      if (room) { room.status = 'limpieza'; room.guest = null; }
      db.tasks.unshift({ id: 'TK-' + Date.now().toString(36).toUpperCase(), room: r.room, priority: 'alta', assignee: null, status: 'pendiente', note: 'Salida de ' + r.guest });
    }
    GA.logActivity('Check-out de ' + r.guest + ' — hab. ' + (r.room || '—') + ' a limpieza');
    GA.save(); renderReservations(); renderBadges();
    toast('Check-out realizado. Habitación enviada a limpieza.');
  }

  // Nueva reserva manual
  $('#btnNewRes').addEventListener('click', () => {
    $('#nrType').innerHTML = Object.keys(db.roomTypes).map(t =>
      `<option value="${t}">${db.roomTypes[t].name} — ${GA.fmtMoney(db.rates[t])}/noche</option>`).join('');
    $('#nrIn').min = GA.todayISO(); $('#nrOut').min = GA.todayISO();
    $('#nrError').textContent = ''; $('#nrTotal').textContent = '';
    $('#modalNewRes').hidden = false;
  });
  function nrPreview() {
    const type = $('#nrType').value, cin = $('#nrIn').value, cout = $('#nrOut').value;
    if (type && cin && cout && cout > cin) {
      const p = GA.stayPricing(type, cin, cout);
      $('#nrTotal').textContent = 'Total estimado: ' + GA.fmtMoney(p.total) + ' (' + p.nights.length + ' noches, temporada aplicada)';
    } else $('#nrTotal').textContent = '';
  }
  ['#nrType', '#nrIn', '#nrOut'].forEach(sel => $(sel).addEventListener('change', nrPreview));
  $('#nrCreate').addEventListener('click', () => {
    const guest = $('#nrGuest').value.trim(), email = $('#nrEmail').value.trim();
    const type = $('#nrType').value, cin = $('#nrIn').value, cout = $('#nrOut').value;
    const guests = parseInt($('#nrGuests').value, 10);
    if (!guest || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('#nrError').textContent = 'Completa nombre y email válidos.'; return; }
    if (!cin || !cout || cout <= cin) { $('#nrError').textContent = 'Revisa las fechas de la reserva.'; return; }
    if (guests > db.roomTypes[type].cap) { $('#nrError').textContent = 'Ese tipo admite máx. ' + db.roomTypes[type].cap + ' huéspedes.'; return; }
    if (GA.availability(type, cin, cout) < 1) { $('#nrError').textContent = 'Sin disponibilidad para ese tipo en esas fechas.'; return; }
    const p = GA.stayPricing(type, cin, cout);
    const r = { code: GA.uid('GA'), guest: guest, email: email, type: type, room: null, checkin: cin, checkout: cout, guests: guests, status: 'confirmada', total: p.total, channel: 'web' };
    db.reservations.push(r);
    GA.logActivity('Nueva reserva manual ' + r.code + ' (' + db.roomTypes[type].name + ')');
    GA.save();
    $('#modalNewRes').hidden = true;
    renderReservations(); renderBadges();
    toast('Reserva ' + r.code + ' creada.');
  });

  /* ================= SERVICIO AL CUARTO ================= */
  function renderOrders() {
    const list = $('#ordersList');
    if (!db.orders.length) { list.innerHTML = '<p class="empty-note">No hay pedidos registrados.</p>'; return; }
    list.innerHTML = db.orders.map(o => `
      <div class="order-card">
        <div class="order-head">
          <b>${o.id}</b><span class="o-room">Hab. ${o.room} · ${o.guest} · ${o.time.slice(11)} hrs</span>
          <span class="badge b-${o.status}">${o.status === 'pendiente' ? 'Pendiente' : o.status === 'preparacion' ? 'En preparación' : 'Entregado'}</span>
        </div>
        <div class="order-items">${o.items.map(i => `<span>${i.qty} × ${i.name} — ${GA.fmtMoney(i.price * i.qty)}</span>`).join('')}</div>
        <div class="order-foot">
          <b>${GA.fmtMoney(o.total)}</b>
          <div class="row-actions">
            ${o.status === 'pendiente' ? `<button class="btn-mini warn" data-prep="${o.id}">En preparación</button>` : ''}
            ${o.status === 'preparacion' ? `<button class="btn-mini primary" data-deliver="${o.id}">Marcar entregado</button>` : ''}
          </div>
        </div>
      </div>`).join('');
    $$('[data-prep]').forEach(b => b.addEventListener('click', () => {
      const o = db.orders.find(x => x.id === b.dataset.prep);
      o.status = 'preparacion';
      GA.logActivity('Pedido ' + o.id + ' en preparación');
      GA.save(); renderOrders(); renderBadges();
    }));
    $$('[data-deliver]').forEach(b => b.addEventListener('click', () => {
      const o = db.orders.find(x => x.id === b.dataset.deliver);
      o.status = 'entregado';
      GA.logActivity('Pedido ' + o.id + ' entregado en hab. ' + o.room);
      GA.save(); renderOrders(); renderBadges(); toast('Pedido ' + o.id + ' entregado.');
    }));
  }

  /* ================= TARIFAS ================= */
  function renderRates() {
    $('#ratesForm').innerHTML = Object.keys(db.roomTypes).map(t => `
      <div class="rate-row">
        <b>${db.roomTypes[t].name}<small>Capacidad ${db.roomTypes[t].cap} · ${db.roomTypes[t].m2} m²</small></b>
        <input type="number" min="1000" step="1000" value="${db.rates[t]}" id="rate-${t}" aria-label="Tarifa ${db.roomTypes[t].name}">
        <button class="btn-mini primary" data-save-rate="${t}">Guardar</button>
      </div>`).join('');
    $$('[data-save-rate]').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.saveRate;
      const v = parseInt($('#rate-' + t).value, 10);
      if (!v || v < 1000) { toast('Ingresa una tarifa válida.', 'error'); return; }
      db.rates[t] = v;
      GA.logActivity('Tarifa base actualizada: ' + db.roomTypes[t].name + ' → ' + GA.fmtMoney(v));
      GA.save(); toast('Tarifa de ' + db.roomTypes[t].name + ' actualizada. Visible en el sitio público.');
    }));

    $('#calcType').innerHTML = Object.keys(db.roomTypes).map(t => `<option value="${t}">${db.roomTypes[t].name}</option>`).join('');
    renderSeasons();
  }
  $('#btnCalc').addEventListener('click', () => {
    const t = $('#calcType').value, cin = $('#calcIn').value, cout = $('#calcOut').value;
    if (!cin || !cout || cout <= cin) { $('#calcResult').textContent = 'Selecciona un rango de fechas válido.'; return; }
    const p = GA.stayPricing(t, cin, cout);
    $('#calcResult').textContent = p.nights.length + ' noche(s) · promedio ' + GA.fmtMoney(p.avg) + '/noche · total ' + GA.fmtMoney(p.total);
  });

  function renderSeasons() {
    $('#tbodySeasons').innerHTML = db.seasons.map(s => `
      <tr>
        <td>${s.name}</td><td>${s.from}</td><td>${s.to}</td>
        <td>${s.adj > 0 ? '+' : ''}${Math.round(s.adj * 100)}%</td>
        <td><button class="btn-mini danger" data-del-season="${s.id}">Eliminar</button></td>
      </tr>`).join('');
    $$('[data-del-season]').forEach(b => b.addEventListener('click', () =>
      confirmAction('Eliminar temporada', '¿Eliminar esta temporada? El ajuste dejará de aplicarse.', () => {
        db.seasons = db.seasons.filter(s => s.id !== b.dataset.delSeason);
        GA.save(); renderSeasons(); toast('Temporada eliminada.');
      })
    ));
  }
  $('#formSeason').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#seasonName').value.trim();
    const from = $('#seasonFrom').value.trim(), to = $('#seasonTo').value.trim();
    const adj = parseFloat($('#seasonAdj').value) / 100;
    const valid = v => /^(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.test(v);
    if (!name || !valid(from) || !valid(to) || isNaN(adj)) { toast('Revisa los datos de la temporada (formato MM-DD).', 'error'); return; }
    db.seasons.push({ id: 's' + Date.now().toString(36), name: name, from: from, to: to, adj: adj });
    GA.logActivity('Temporada creada: ' + name + ' (' + (adj * 100) + '%)');
    GA.save(); e.target.reset(); renderSeasons(); toast('Temporada agregada.');
  });

  /* ================= PAQUETES / CUPONES ================= */
  function renderPromos() {
    $('#tbodyPromos').innerHTML = db.promos.map(p => `
      <tr>
        <td><b>${p.code}</b></td>
        <td>−${p.pct}%</td>
        <td>${p.minNights || '—'}</td>
        <td><label class="switch"><input type="checkbox" data-toggle-promo="${p.code}" ${p.active ? 'checked' : ''}><i></i></label></td>
        <td><button class="btn-mini danger" data-del-promo="${p.code}">Eliminar</button></td>
      </tr>`).join('');
    $$('[data-toggle-promo]').forEach(t => t.addEventListener('change', () => {
      const p = db.promos.find(x => x.code === t.dataset.togglePromo);
      p.active = t.checked;
      GA.logActivity('Cupón ' + p.code + (p.active ? ' activado' : ' desactivado'));
      GA.save(); toast('Cupón ' + p.code + (p.active ? ' activado.' : ' desactivado.'));
    }));
    $$('[data-del-promo]').forEach(b => b.addEventListener('click', () =>
      confirmAction('Eliminar cupón', '¿Eliminar el cupón ' + b.dataset.delPromo + '?', () => {
        db.promos = db.promos.filter(p => p.code !== b.dataset.delPromo);
        GA.save(); renderPromos(); toast('Cupón eliminado.');
      })
    ));
  }
  $('#formPromo').addEventListener('submit', e => {
    e.preventDefault();
    const code = $('#promoCode').value.trim().toUpperCase();
    const pct = parseInt($('#promoPct').value, 10);
    const min = parseInt($('#promoMin').value, 10) || 0;
    if (!code || !pct || pct < 1 || pct > 90) { toast('Revisa el código y el porcentaje.', 'error'); return; }
    if (db.promos.some(p => p.code === code)) { toast('Ya existe un cupón con ese código.', 'error'); return; }
    db.promos.push({ code: code, pct: pct, minNights: min, active: true });
    GA.logActivity('Cupón creado: ' + code + ' (−' + pct + '%)');
    GA.save(); e.target.reset(); renderPromos(); toast('Cupón ' + code + ' creado y activo.');
  });

  /* ================= CANALES ================= */
  const chanInitials = { booking: 'B.', trivago: 'TR', turismocity: 'TC', despegar: 'D.' };
  function timeAgo(iso) {
    if (!iso) return 'nunca';
    const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (min < 60) return 'hace ' + min + ' min';
    const h = Math.round(min / 60);
    return h < 24 ? 'hace ' + h + ' h' : 'hace ' + Math.round(h / 24) + ' días';
  }
  function renderChannels() {
    $('#adminChannels').innerHTML = db.channels.map(c => `
      <div class="admin-channel">
        <div class="ac-head">
          <span class="ac-logo">${chanInitials[c.id] || c.name[0]}</span>
          <b>${c.name}</b>
          <label class="switch" title="Conectar / desconectar"><input type="checkbox" data-toggle-chan="${c.id}" ${c.connected ? 'checked' : ''}><i></i></label>
        </div>
        <div class="ac-stats">
          <span>Reservas del mes: <b>${c.monthRes}</b></span>
          <span>Comisión: <b>${c.comision}%</b></span>
        </div>
        <div class="ac-sync">
          <time>Última sincronización: ${timeAgo(c.lastSync)}</time>
          <button class="btn-mini primary" data-sync="${c.id}" ${c.connected ? '' : 'disabled'}>Sincronizar ahora</button>
        </div>
      </div>`).join('');
    $$('[data-toggle-chan]').forEach(t => t.addEventListener('change', () => {
      const c = db.channels.find(x => x.id === t.dataset.toggleChan);
      c.connected = t.checked;
      if (c.connected) c.lastSync = new Date().toISOString();
      GA.logActivity('Canal ' + c.name + (c.connected ? ' conectado' : ' desconectado'));
      GA.save(); renderChannels();
      toast('Canal ' + c.name + (c.connected ? ' conectado.' : ' desconectado.'));
    }));
    $$('[data-sync]').forEach(b => b.addEventListener('click', () => {
      const c = db.channels.find(x => x.id === b.dataset.sync);
      b.disabled = true;
      b.innerHTML = '<span class="spinner"></span>';
      setTimeout(() => {
        c.lastSync = new Date().toISOString();
        GA.logActivity('Canal ' + c.name + ' sincronizado');
        GA.save(); renderChannels();
        toast('Canal ' + c.name + ' sincronizado correctamente.');
      }, 1500);
    }));
  }

  /* ================= CONFIGURACIÓN ================= */
  function renderSettings() {
    $('#setName').value = db.settings.hotelName;
    $('#setPhone').value = db.settings.phone;
    $('#setEmail').value = db.settings.email;
    $('#setAddress').value = db.settings.address;
  }
  $('#formSettings').addEventListener('submit', e => {
    e.preventDefault();
    db.settings.hotelName = $('#setName').value.trim() || db.settings.hotelName;
    db.settings.phone = $('#setPhone').value.trim();
    db.settings.email = $('#setEmail').value.trim();
    db.settings.address = $('#setAddress').value.trim();
    GA.logActivity('Datos del hotel actualizados');
    GA.save(); toast('Configuración guardada.');
  });
  $('#btnReset').addEventListener('click', () =>
    confirmAction('Restablecer datos demo', 'Se perderán todas las reservas, pedidos y cambios realizados. ¿Continuar?', () => {
      GA.reset();
      renderAll();
      toast('Datos de demostración restablecidos.');
    })
  );

  /* ================= Arranque ================= */
  if (isLogged()) showApp(); else showLogin();
})();
