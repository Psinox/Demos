/* ============================================================
   Grand Aurora Resort & Spa — Sitio público · Demo Plan Premium
   Lee y escribe sobre la capa de datos compartida (window.GA).
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const db = GA.db;

  /* ---------- Preloader ---------- */
  window.addEventListener('load', () => setTimeout(() => $('#preloader').classList.add('done'), 500));
  setTimeout(() => $('#preloader').classList.add('done'), 2500); // respaldo

  /* ---------- Header / menú móvil / reveal / toTop / año ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const hamb = $('#hamb'), navLinks = $('#navLinks');
  hamb.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamb.setAttribute('aria-expanded', String(open));
  });
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); hamb.setAttribute('aria-expanded', 'false');
  }));

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  const toTop = $('#toTop');
  window.addEventListener('scroll', () => { toTop.hidden = window.scrollY < 500; }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Suites (precios en vivo desde GA.db.rates) ---------- */
  const suitePhotos = { deluxe: 'sp-deluxe', ejecutiva: 'sp-ejecutiva', presidencial: 'sp-presidencial', villa: 'sp-villa' };
  const suiteAmenities = {
    deluxe: ['Cama king', 'Vista al mar', 'Baño de mármol', 'Smart TV 55"'],
    ejecutiva: ['Terraza privada', 'Sala de estar', 'Cafetera Nespresso', ' amenities de autor'],
    presidencial: ['Jacuzzi panorámico', 'Comedor para 6', 'Mayordomo dedicado', 'Check-in privado'],
    villa: ['Piscina privada', 'Cocina de chef', 'Jardín propio', 'Traslado incluido']
  };
  function renderSuites() {
    $('#suitesGrid').innerHTML = Object.keys(db.roomTypes).map(t => {
      const rt = db.roomTypes[t];
      return `<article class="suite-card reveal visible">
        <div class="suite-photo ${suitePhotos[t]}" role="img" aria-label="${rt.name}"></div>
        <div class="suite-body">
          <h3>${rt.name}</h3>
          <p class="suite-meta">${rt.cap} huéspedes · ${rt.m2} m²</p>
          <ul class="suite-amen">${suiteAmenities[t].map(a => `<li>${a.trim()}</li>`).join('')}</ul>
          <p class="suite-price">${GA.fmtMoney(db.rates[t])} <small>/ noche (base)</small></p>
        </div>
      </article>`;
    }).join('');
  }
  renderSuites();

  /* ---------- Canales (estado en vivo desde GA.db.channels) ---------- */
  const chanInitials = { booking: 'B.', trivago: 'trivago', turismocity: 'TC', despegar: 'D.' };
  function renderChannels() {
    $('#channelsGrid').innerHTML = db.channels.map(c => `
      <div class="channel-card reveal visible">
        <div class="channel-logo"><b>${chanInitials[c.id] || c.name[0]}</b></div>
        <h3>${c.name}</h3>
        <p>Tarifas y disponibilidad sincronizadas</p>
        <span class="chip ${c.connected ? 'on' : 'off'}">${c.connected ? 'Sincronizado' : 'No conectado'}</span>
      </div>`).join('');
  }
  renderChannels();

  /* ---------- Contacto desde settings ---------- */
  const s = db.settings;
  $('#contactInfo').innerHTML = `
    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>${s.address}</li>
    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>${s.phone}</li>
    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>${s.email}</li>
    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>Concierge 24/7</li>`;

  /* ============================================================
     MOTOR DE RESERVAS
     ============================================================ */
  const state = { checkin: null, checkout: null, guests: 2, promo: null, type: null, meal: 'none', acts: new Set() };
  const hoy = GA.todayISO();
  const bbIn = $('#bb-in'), bbOut = $('#bb-out');
  bbIn.min = hoy; bbOut.min = hoy;
  bbIn.addEventListener('change', () => { if (bbIn.value) bbOut.min = GA.addDays(bbIn.value, 1); });

  $('#bookingBar').addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#bbError');
    err.textContent = '';
    const cin = bbIn.value, cout = bbOut.value;
    if (!cin || !cout) { err.textContent = 'Selecciona las fechas de llegada y salida.'; return; }
    if (cin < hoy) { err.textContent = 'La llegada no puede ser en el pasado.'; return; }
    if (cout <= cin) { err.textContent = 'La salida debe ser posterior a la llegada.'; return; }

    state.checkin = cin; state.checkout = cout;
    state.guests = parseInt($('#bb-guests').value, 10);
    state.type = null; state.meal = 'none'; state.acts.clear();

    // Cupón
    const code = $('#bb-promo').value.trim().toUpperCase();
    state.promo = null;
    if (code) {
      const p = db.promos.find(x => x.code === code);
      if (!p || !p.active) { err.textContent = 'El cupón "' + code + '" no es válido o está inactivo.'; }
      else if (state.nights() < p.minNights) { err.textContent = 'El cupón ' + code + ' exige un mínimo de ' + p.minNights + ' noches.'; }
      else state.promo = p;
    }
    renderAvailability();
    $('#reservar').scrollIntoView({ behavior: 'smooth' });
  });

  state.nights = function () {
    if (!state.checkin || !state.checkout) return 0;
    let n = 0, d = state.checkin;
    while (d < state.checkout) { n++; d = GA.addDays(d, 1); }
    return n;
  };

  function renderAvailability() {
    const grid = $('#availResults');
    grid.hidden = false;
    $('#availHint').textContent = 'Del ' + GA.fmtDate(state.checkin) + ' al ' + GA.fmtDate(state.checkout) + ' · ' + state.nights() + ' noche(s) · ' + state.guests + ' huésped(es).';
    grid.innerHTML = Object.keys(db.roomTypes).map(t => {
      const rt = db.roomTypes[t];
      const avail = GA.availability(t, state.checkin, state.checkout);
      const pricing = GA.stayPricing(t, state.checkin, state.checkout);
      const units = db.rooms.filter(r => r.type === t).length;
      const pct = units ? Math.round(avail / units * 100) : 0;
      const cls = avail === 0 ? 'none' : (pct <= 30 ? 'low' : 'ok');
      const label = avail === 0 ? 'Sin disponibilidad' : 'Quedan ' + avail + ' de ' + units;
      const fits = state.guests <= rt.cap;
      return `<article class="avail-card" data-type="${t}">
        <h3>${rt.name}</h3>
        <p class="avail-price">${GA.fmtMoney(pricing.avg)} <small>/ noche prom.</small></p>
        <p class="avail-note">${pricing.nights.some(n => n.adj > 0) ? 'Incluye noches en temporada alta' : pricing.nights.some(n => n.adj < 0) ? 'Incluye noches en temporada baja' : 'Temporada media'} · total alojamiento ${GA.fmtMoney(pricing.total)}</p>
        <p class="avail-count ${cls}">${label}</p>
        <div class="avail-bar"><i style="width:${pct}%"></i></div>
        ${!fits ? `<p class="avail-count none">Capacidad máx. ${rt.cap} personas</p>` : ''}
        <button class="btn btn-outline-gold btn-sm" data-select="${t}" ${avail === 0 || !fits ? 'disabled' : ''}>${avail === 0 ? 'Agotada' : 'Seleccionar'}</button>
      </article>`;
    }).join('');

    $$('[data-select]', grid).forEach(btn => btn.addEventListener('click', () => {
      state.type = btn.dataset.select;
      $$('.avail-card', grid).forEach(c => c.classList.toggle('selected', c.dataset.type === state.type));
      openBuilder();
    }));
  }

  function openBuilder() {
    $('#builder').hidden = false;
    const rt = db.roomTypes[state.type];
    $('#builderRoom').textContent = rt.name + ' · ' + state.nights() + ' noche(s) · ' + state.guests + ' huésped(es)';

    $('#mealOptions').innerHTML = db.meals.map(m => `
      <label class="opt">
        <input type="radio" name="meal" value="${m.id}" ${m.id === state.meal ? 'checked' : ''}>
        <span><b>${m.name}</b><span>${m.ppd ? GA.fmtMoney(m.ppd) + ' por persona/día' : 'Sin costo adicional'}</span></span>
      </label>`).join('');
    $$('input[name="meal"]').forEach(r => r.addEventListener('change', () => { state.meal = r.value; renderSummary(); }));

    $('#actOptions').innerHTML = db.activities.map(a => `
      <label class="opt">
        <input type="checkbox" value="${a.id}" ${state.acts.has(a.id) ? 'checked' : ''}>
        <span><b>${a.name}</b><span>${GA.fmtMoney(a.price)} por persona</span></span>
      </label>`).join('');
    $$('#actOptions input').forEach(c => c.addEventListener('change', () => {
      c.checked ? state.acts.add(c.value) : state.acts.delete(c.value);
      renderSummary();
    }));

    renderSummary();
    $('#builder').scrollIntoView({ behavior: 'smooth' });
  }

  function computeTotals() {
    const nights = state.nights();
    const pricing = GA.stayPricing(state.type, state.checkin, state.checkout);
    const meal = db.meals.find(m => m.id === state.meal);
    const mealTotal = meal.ppd * state.guests * nights;
    const acts = db.activities.filter(a => state.acts.has(a.id));
    const actsTotal = acts.reduce((s, a) => s + a.price * state.guests, 0);
    const subtotal = pricing.total + mealTotal + actsTotal;
    const discount = state.promo ? Math.round(subtotal * state.promo.pct / 100) : 0;
    return { nights, pricing, meal, mealTotal, acts, actsTotal, subtotal, discount, total: subtotal - discount };
  }

  function renderSummary() {
    const t = computeTotals();
    const lines = [
      ['Noches', t.nights],
      ['Alojamiento (con temporada)', GA.fmtMoney(t.pricing.total)],
      [t.meal.name + ' × ' + state.guests + ' pers.', GA.fmtMoney(t.mealTotal)]
    ];
    t.acts.forEach(a => lines.push([a.name + ' × ' + state.guests, GA.fmtMoney(a.price * state.guests)]));
    lines.push(['Subtotal', GA.fmtMoney(t.subtotal)]);
    $('#summaryLines').innerHTML = lines.map(l => `<div><dt>${l[0]}</dt><dd>${l[1]}</dd></div>`).join('') +
      (t.discount ? `<div><dt>Cupón ${state.promo.code} (−${state.promo.pct}%)</dt><dd class="discount">−${GA.fmtMoney(t.discount)}</dd></div>` : '');
    $('#summaryTotal').textContent = GA.fmtMoney(t.total);
  }

  /* ---------- Confirmación ---------- */
  $('#btnConfirm').addEventListener('click', () => {
    if (!state.type) return;
    $('#mgError').textContent = '';
    $('#modalGuest').hidden = false;
    setTimeout(() => $('#mgName').focus(), 60);
  });
  $('#mgCancel').addEventListener('click', () => { $('#modalGuest').hidden = true; });

  $('#mgOk').addEventListener('click', () => {
    const name = $('#mgName').value.trim();
    const email = $('#mgEmail').value.trim();
    if (!name) { $('#mgError').textContent = 'Ingresa el nombre del huésped.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('#mgError').textContent = 'Ingresa un email válido.'; return; }

    const t = computeTotals();
    const res = {
      code: GA.uid('GA'), guest: name, email: email, type: state.type, room: null,
      checkin: state.checkin, checkout: state.checkout, guests: state.guests,
      status: 'confirmada', total: t.total, channel: 'web'
    };
    db.reservations.push(res);
    GA.logActivity('Nueva reserva web ' + res.code + ' (' + db.roomTypes[state.type].name + ')');
    GA.save();

    $('#modalGuest').hidden = true;
    $('#resCode').textContent = res.code;
    $('#resSummary').innerHTML = [
      ['Huésped', res.guest],
      ['Suite', db.roomTypes[res.type].name],
      ['Llegada', GA.fmtDate(res.checkin)],
      ['Salida', GA.fmtDate(res.checkout)],
      ['Noches', t.nights],
      ['Huéspedes', res.guests],
      ['Plan de comidas', t.meal.name],
      ['Total pagado', GA.fmtMoney(res.total)]
    ].map(l => `<div><dt>${l[0]}</dt><dd>${l[1]}</dd></div>`).join('');
    $('#modalSuccess').hidden = false;

    // Refrescar disponibilidad (la nueva reserva bloquea fechas)
    renderAvailability();
  });
  $('#btnDone').addEventListener('click', () => { $('#modalSuccess').hidden = true; });
  $('#btnPrint').addEventListener('click', () => window.print());

  /* ============================================================
     SERVICIO A LA HABITACIÓN
     ============================================================ */
  const rsMenuData = [
    { cat: 'Desayunos' },
    { id: 'd1', name: 'Desayuno Grand Aurora', desc: 'Huevos benedictinos, pan brioche, fruta y café de grano', price: 18000 },
    { id: 'd2', name: 'Desayuno ligero', desc: 'Yogur griego, granola artesanal y miel de ulmo', price: 12000 },
    { id: 'd3', name: 'Tostadas francesas', desc: 'Con frutos rojos y azúcar flor', price: 14000 },
    { cat: 'Platos' },
    { id: 'p1', name: 'Salmón ahumado y palta', desc: 'Sobre pan de masa madre con eneldo', price: 24000 },
    { id: 'p2', name: 'Risotto de mariscos', desc: 'Con camarones, ostiones y aliño de la casa', price: 28000 },
    { id: 'p3', name: 'Filete de res', desc: 'Con papas trufadas y reducción de merlot', price: 32000 },
    { id: 'p4', name: 'Ensalada César de king crab', desc: 'Lechuga romana, parmesano y crutones', price: 26000 },
    { cat: 'Bebidas' },
    { id: 'b1', name: 'Vino de la casa (copa)', desc: 'Carmenère reserva, Valle del Maipo', price: 9000 },
    { id: 'b2', name: 'Champán (botella)', desc: 'Brut nature, servido en hielera', price: 68000 },
    { id: 'b3', name: 'Coctel Aurora', desc: 'Pisco, maracuyá y bitter de naranja', price: 11000 }
  ];
  const cart = {}; // id -> qty

  function renderRsMenu() {
    $('#rsMenu').innerHTML = rsMenuData.map(item => {
      if (item.cat) return `<h3 class="rs-cat">${item.cat}</h3>`;
      return `<div class="rs-item">
        <div class="rs-info"><b>${item.name}</b><span>${item.desc}</span></div>
        <span class="rs-price">${GA.fmtMoney(item.price)}</span>
        <div class="stepper">
          <button type="button" data-dec="${item.id}" aria-label="Quitar uno">−</button>
          <output id="qty-${item.id}">0</output>
          <button type="button" data-inc="${item.id}" aria-label="Agregar uno">+</button>
        </div>
      </div>`;
    }).join('');
    $$('[data-inc]').forEach(b => b.addEventListener('click', () => { setQty(b.dataset.inc, (cart[b.dataset.inc] || 0) + 1); }));
    $$('[data-dec]').forEach(b => b.addEventListener('click', () => { setQty(b.dataset.dec, Math.max(0, (cart[b.dataset.dec] || 0) - 1)); }));
  }
  function setQty(id, qty) {
    if (qty === 0) delete cart[id]; else cart[id] = qty;
    const out = $('#qty-' + id);
    if (out) out.textContent = qty;
    renderCart();
  }
  function renderCart() {
    const ids = Object.keys(cart);
    const box = $('#rsItems');
    if (!ids.length) { box.innerHTML = '<p class="rs-empty">Aún no agregas ítems.</p>'; $('#rsTotal').textContent = GA.fmtMoney(0); return; }
    let total = 0;
    box.innerHTML = ids.map(id => {
      const item = rsMenuData.find(x => x.id === id);
      const line = item.price * cart[id];
      total += line;
      return `<div class="rs-line"><span>${cart[id]} × ${item.name}</span><b>${GA.fmtMoney(line)}</b></div>`;
    }).join('');
    $('#rsTotal').textContent = GA.fmtMoney(total);
  }

  // Select de habitaciones (16)
  $('#rsRoom').innerHTML = '<option value="">Selecciona…</option>' + db.rooms.map(r =>
    `<option value="${r.number}">Habitación ${r.number}</option>`).join('');

  $('#rsSend').addEventListener('click', () => {
    const err = $('#rsError'), ok = $('#rsSuccess');
    err.textContent = ''; ok.classList.remove('show');
    const ids = Object.keys(cart);
    const room = $('#rsRoom').value;
    const guest = $('#rsGuest').value.trim();
    if (!ids.length) { err.textContent = 'Agrega al menos un ítem al pedido.'; return; }
    if (!room) { err.textContent = 'Selecciona el número de habitación.'; return; }
    if (!guest) { err.textContent = 'Ingresa el nombre del huésped.'; return; }

    let total = 0;
    const items = ids.map(id => {
      const item = rsMenuData.find(x => x.id === id);
      total += item.price * cart[id];
      return { name: item.name, qty: cart[id], price: item.price };
    });
    const order = {
      id: 'RS-' + (1000 + db.orders.length + 1 + Math.floor(Math.random() * 90)),
      room: parseInt(room, 10), guest: guest, items: items, total: total,
      time: GA.todayISO() + ' ' + new Date().toTimeString().slice(0, 5),
      status: 'pendiente'
    };
    db.orders.unshift(order);
    GA.logActivity('Pedido de servicio al cuarto ' + order.id + ' (hab. ' + order.room + ')');
    GA.save();

    Object.keys(cart).forEach(id => setQty(id, 0));
    $('#rsGuest').value = ''; $('#rsRoom').value = '';
    ok.textContent = 'Pedido ' + order.id + ' enviado a cocina. Tiempo estimado: 25–35 minutos.';
    ok.classList.add('show');
    setTimeout(() => ok.classList.remove('show'), 9000);
  });

  renderRsMenu();
  renderCart();

  /* ============================================================
     LIGHTBOX
     ============================================================ */
  const items = $$('.m-item');
  const lightbox = $('#lightbox');
  const lbImage = $('#lbImage'), lbCaption = $('#lbCaption');
  let current = 0;
  function openLightbox(i) {
    current = (i + items.length) % items.length;
    const item = items[current];
    lbImage.className = 'lb-image';
    const gClass = Array.from(item.classList).find(c => /^ga\d+$/.test(c));
    if (gClass) lbImage.classList.add(gClass);
    lbCaption.textContent = item.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLightbox() { lightbox.hidden = true; document.body.style.overflow = ''; }
  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); } });
  });
  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', () => openLightbox(current - 1));
  $('#lbNext').addEventListener('click', () => openLightbox(current + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox(current - 1);
    if (e.key === 'ArrowRight') openLightbox(current + 1);
  });
})();
