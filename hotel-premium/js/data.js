/* ============================================================
   Grand Aurora Resort & Spa — Capa de datos compartida
   Sitio público y panel de administración leen/escriben aquí.
   Persistencia: localStorage key "grandaurora_db_v1"
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'grandaurora_db_v1';

  /* ---------- Utilidades de fecha ---------- */
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtMoney(n) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
  }
  function uid(prefix) {
    return prefix + '-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }
  function overlaps(aIn, aOut, bIn, bOut) { return aIn < bOut && bIn < aOut; }

  /* ---------- Temporadas ---------- */
  // from/to en 'MM-DD'; un rango cruza año nuevo si from > to
  function seasonAdjForDate(iso, seasons) {
    const md = iso.slice(5); // 'MM-DD'
    const list = seasons || (db && db.seasons) || [];
    for (const s of list) {
      const crosses = s.from > s.to;
      const inRange = crosses ? (md >= s.from || md <= s.to) : (md >= s.from && md <= s.to);
      if (inRange) return s.adj;
    }
    return 0;
  }
  function nightPrice(type, iso) {
    return Math.round(db.rates[type] * (1 + seasonAdjForDate(iso)));
  }
  // Promedio prorrateado por noche para un rango
  function stayPricing(type, checkin, checkout) {
    const nights = [];
    let d = checkin;
    while (d < checkout) {
      const adj = seasonAdjForDate(d);
      nights.push({ date: d, adj: adj, price: Math.round(db.rates[type] * (1 + adj)) });
      d = addDays(d, 1);
    }
    const total = nights.reduce((s, n) => s + n.price, 0);
    return { nights: nights, total: total, avg: nights.length ? Math.round(total / nights.length) : 0 };
  }

  /* ---------- Semilla ---------- */
  function seed() {
    const hoy = todayISO();
    const rooms = [];
    const typeByFloor = { 1: 'deluxe', 2: 'ejecutiva', 3: 'presidencial', 4: 'villa' };
    const seedStatus = {
      101: ['ocupada', 'Martín Herrera'], 102: ['limpieza', null], 103: ['disponible', null], 104: ['ocupada', 'Sofía Campos'],
      201: ['ocupada', 'Lucía Fernández'], 202: ['disponible', null], 203: ['limpieza', null], 204: ['ocupada', 'Jorge Paredes'],
      301: ['ocupada', 'Valentina Ríos'], 302: ['disponible', null], 303: ['mantenimiento', null], 304: ['disponible', null],
      401: ['ocupada', 'Andrés Soto'], 402: ['mantenimiento', null], 403: ['limpieza', null], 404: ['disponible', null]
    };
    for (let f = 1; f <= 4; f++) {
      for (let u = 1; u <= 4; u++) {
        const num = f * 100 + u;
        rooms.push({ number: num, floor: f, type: typeByFloor[f], status: seedStatus[num][0], guest: seedStatus[num][1], note: '' });
      }
    }

    const db = {
      rooms: rooms,
      roomTypes: {
        deluxe: { name: 'Deluxe King', cap: 2, m2: 38 },
        ejecutiva: { name: 'Suite Ejecutiva', cap: 3, m2: 55 },
        presidencial: { name: 'Suite Presidencial', cap: 4, m2: 95 },
        villa: { name: 'Villa Privada', cap: 6, m2: 140 }
      },
      rates: { deluxe: 180000, ejecutiva: 260000, presidencial: 450000, villa: 620000 },
      seasons: [
        { id: 's1', name: 'Temporada Alta', from: '12-15', to: '02-28', adj: 0.35 },
        { id: 's2', name: 'Temporada Media', from: '03-01', to: '06-30', adj: 0 },
        { id: 's3', name: 'Temporada Baja', from: '07-01', to: '08-31', adj: -0.15 },
        { id: 's4', name: 'Temporada Media', from: '09-01', to: '12-14', adj: 0 }
      ],
      promos: [
        { code: 'LUJO15', pct: 15, minNights: 0, active: true },
        { code: 'LUNADEMIEL', pct: 20, minNights: 0, active: true },
        { code: 'SEMANA7', pct: 25, minNights: 7, active: true }
      ],
      meals: [
        { id: 'none', name: 'Solo alojamiento', ppd: 0 },
        { id: 'desayuno', name: 'Desayuno gourmet', ppd: 12000 },
        { id: 'media', name: 'Media pensión', ppd: 28000 },
        { id: 'full', name: 'Todo incluido', ppd: 52000 }
      ],
      activities: [
        { id: 'spa', name: 'Ritual de spa (90 min)', price: 85000 },
        { id: 'golf', name: 'Ronda de golf 18 hoyos', price: 95000 },
        { id: 'yate', name: 'Paseo en yate privado', price: 180000 },
        { id: 'cena', name: 'Cena degustación 7 tiempos', price: 110000 }
      ],
      reservations: [
        { code: 'GA-2026-MH72A', guest: 'Martín Herrera', email: 'martin.h@mail.com', type: 'deluxe', room: 101, checkin: addDays(hoy, -2), checkout: hoy, guests: 2, status: 'checkin', total: 396000, channel: 'booking' },
        { code: 'GA-2026-SC41B', guest: 'Sofía Campos', email: 'sofia.c@mail.com', type: 'deluxe', room: 104, checkin: addDays(hoy, -1), checkout: addDays(hoy, 2), guests: 2, status: 'checkin', total: 594000, channel: 'web' },
        { code: 'GA-2026-LF93C', guest: 'Lucía Fernández', email: 'lucia.f@mail.com', type: 'ejecutiva', room: 201, checkin: addDays(hoy, -3), checkout: hoy, guests: 2, status: 'checkin', total: 780000, channel: 'despegar' },
        { code: 'GA-2026-JP28D', guest: 'Jorge Paredes', email: 'jorge.p@mail.com', type: 'ejecutiva', room: 204, checkin: addDays(hoy, -1), checkout: addDays(hoy, 3), guests: 3, status: 'checkin', total: 1144000, channel: 'web' },
        { code: 'GA-2026-VR55E', guest: 'Valentina Ríos', email: 'vale.r@mail.com', type: 'presidencial', room: 301, checkin: addDays(hoy, -2), checkout: addDays(hoy, 1), guests: 2, status: 'checkin', total: 1485000, channel: 'booking' },
        { code: 'GA-2026-AS67F', guest: 'Andrés Soto', email: 'andres.s@mail.com', type: 'villa', room: 401, checkin: addDays(hoy, -4), checkout: addDays(hoy, 2), guests: 5, status: 'checkin', total: 3720000, channel: 'trivago' },
        { code: 'GA-2026-CG10G', guest: 'Camila González', email: 'cami.g@mail.com', type: 'deluxe', room: null, checkin: hoy, checkout: addDays(hoy, 3), guests: 2, status: 'confirmada', total: 594000, channel: 'web' },
        { code: 'GA-2026-RM84H', guest: 'Ricardo Mora', email: 'r.mora@mail.com', type: 'ejecutiva', room: null, checkin: hoy, checkout: addDays(hoy, 2), guests: 2, status: 'confirmada', total: 572000, channel: 'turismocity' },
        { code: 'GA-2026-FL39I', guest: 'Fernanda Lagos', email: 'fer.l@mail.com', type: 'presidencial', room: null, checkin: addDays(hoy, 5), checkout: addDays(hoy, 9), guests: 3, status: 'confirmada', total: 1980000, channel: 'web' },
        { code: 'GA-2026-PB02J', guest: 'Pablo Bravo', email: 'p.bravo@mail.com', type: 'deluxe', room: null, checkin: addDays(hoy, -8), checkout: addDays(hoy, -5), guests: 2, status: 'checkout', total: 594000, channel: 'booking' }
      ],
      orders: [
        { id: 'RS-1001', room: 104, guest: 'Sofía Campos', items: [{ name: 'Salmón ahumado y palta', qty: 1, price: 24000 }, { name: 'Vino de la casa (copa)', qty: 2, price: 9000 }], total: 42000, time: addDays(hoy, 0) + ' 12:40', status: 'pendiente' },
        { id: 'RS-1002', room: 301, guest: 'Valentina Ríos', items: [{ name: 'Desayuno Grand Aurora', qty: 2, price: 18000 }], total: 36000, time: addDays(hoy, 0) + ' 09:15', status: 'preparacion' },
        { id: 'RS-1003', room: 201, guest: 'Lucía Fernández', items: [{ name: 'Risotto de mariscos', qty: 1, price: 28000 }], total: 28000, time: addDays(hoy, -1) + ' 20:32', status: 'entregado' }
      ],
      tasks: [
        { id: 'TK-1', room: 102, priority: 'alta', assignee: 'Rosa Méndez', status: 'proceso', note: 'Salida con early check-in siguiente' },
        { id: 'TK-2', room: 203, priority: 'media', assignee: null, status: 'pendiente', note: '' },
        { id: 'TK-3', room: 403, priority: 'baja', assignee: 'Ana Rojas', status: 'pendiente', note: 'Cambio de cortinas' },
        { id: 'TK-4', room: 104, priority: 'media', assignee: 'Carlos Fuentes', status: 'terminada', note: 'Repaso diario' }
      ],
      channels: [
        { id: 'booking', name: 'Booking.com', connected: true, lastSync: new Date(Date.now() - 18 * 60000).toISOString(), comision: 17, monthRes: 12 },
        { id: 'trivago', name: 'Trivago', connected: true, lastSync: new Date(Date.now() - 42 * 60000).toISOString(), comision: 12, monthRes: 5 },
        { id: 'turismocity', name: 'Turismocity', connected: false, lastSync: null, comision: 10, monthRes: 0 },
        { id: 'despegar', name: 'Despegar', connected: true, lastSync: new Date(Date.now() - 7 * 60000).toISOString(), comision: 15, monthRes: 8 }
      ],
      activity: [
        { time: new Date(Date.now() - 12 * 60000).toISOString(), text: 'Pedido de servicio al cuarto RS-1001 (hab. 104)' },
        { time: new Date(Date.now() - 40 * 60000).toISOString(), text: 'Check-in de Valentina Ríos confirmado (hab. 301)' },
        { time: new Date(Date.now() - 95 * 60000).toISOString(), text: 'Nueva reserva web GA-2026-FL39I (Suite Presidencial)' },
        { time: new Date(Date.now() - 150 * 60000).toISOString(), text: 'Canal Booking.com sincronizado' },
        { time: new Date(Date.now() - 210 * 60000).toISOString(), text: 'Habitación 303 pasó a mantenimiento' }
      ],
      settings: {
        hotelName: 'Grand Aurora Resort & Spa',
        phone: '+56 32 245 8800',
        email: 'reservas@grandaurora.cl',
        address: 'Av. Costanera Norte 1500, Bahía Serena'
      }
    };
    return db;
  }

  /* ---------- Persistencia ---------- */
  let db = null;
  function load() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : seed();
    } catch (e) { db = seed(); }
    if (!raw_ok()) save();
    return db;
  }
  function raw_ok() {
    try { return Boolean(localStorage.getItem(KEY)); } catch (e) { return true; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* modo demo sin persistencia */ }
  }
  function reset() {
    db = seed();
    save();
  }
  function logActivity(text) {
    db.activity.unshift({ time: new Date().toISOString(), text: text });
    db.activity = db.activity.slice(0, 30);
  }

  /* ---------- Disponibilidad real desde los datos ---------- */
  // Disponibles = unidades del tipo − reservas solapadas (confirmada/checkin) − unidades en mantenimiento
  function availability(type, checkin, checkout) {
    const units = db.rooms.filter(r => r.type === type).length;
    const maint = db.rooms.filter(r => r.type === type && r.status === 'mantenimiento').length;
    const booked = db.reservations.filter(r =>
      r.type === type && (r.status === 'confirmada' || r.status === 'checkin') && overlaps(checkin, checkout, r.checkin, r.checkout)
    ).length;
    return Math.max(0, units - maint - booked);
  }

  /* ---------- API pública ---------- */
  window.GA = {
    get db() { return load(); },
    load: load,
    save: save,
    reset: reset,
    logActivity: logActivity,
    fmtMoney: fmtMoney,
    fmtDate: fmtDate,
    todayISO: todayISO,
    addDays: addDays,
    overlaps: overlaps,
    seasonAdjForDate: seasonAdjForDate,
    nightPrice: nightPrice,
    stayPricing: stayPricing,
    availability: availability,
    uid: uid
  };
})();
