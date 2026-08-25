/* ============================================================
   Casa Serena — Hotel Boutique · Demo Plan Básico
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Header con sombra al scroll ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  const hamb = $('#hamb');
  const navLinks = $('#navLinks');
  hamb.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamb.setAttribute('aria-expanded', String(open));
    hamb.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('a', navLinks).forEach(a =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamb.setAttribute('aria-expanded', 'false');
    })
  );

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Lightbox de galería ---------- */
  const items = $$('.g-item');
  const lightbox = $('#lightbox');
  const lbImage = $('#lbImage');
  const lbCaption = $('#lbCaption');
  let current = 0;

  function openLightbox(i) {
    current = (i + items.length) % items.length;
    const item = items[current];
    lbImage.className = 'lb-image';
    // Reutiliza la clase de gradiente de la miniatura (g1..g8)
    const gClass = Array.from(item.classList).find(c => /^g\d+$/.test(c));
    if (gClass) lbImage.classList.add(gClass);
    lbCaption.textContent = item.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }
  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
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

  /* ---------- Preselección de habitación ---------- */
  const selectHab = $('#f-habitacion');
  $$('[data-room]').forEach(btn =>
    btn.addEventListener('click', () => {
      selectHab.value = btn.dataset.room;
      $('#contacto').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => $('#f-nombre').focus({ preventScroll: true }), 700);
    })
  );

  /* ---------- Validación del formulario ---------- */
  const form = $('#formConsulta');
  const hoy = new Date().toISOString().split('T')[0];
  $('#f-llegada').min = hoy;
  $('#f-salida').min = hoy;

  function setError(campo, msg) {
    const err = $('#err-' + campo);
    const field = $('#f-' + campo).closest('.field');
    if (err) err.textContent = msg || '';
    if (field) field.classList.toggle('invalid', Boolean(msg));
    return !msg;
  }
  function validar() {
    let ok = true;
    const nombre = $('#f-nombre').value.trim();
    const email = $('#f-email').value.trim();
    const llegada = $('#f-llegada').value;
    const salida = $('#f-salida').value;

    ok = setError('nombre', nombre ? '' : 'Ingresa tu nombre.') && ok;
    ok = setError('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Ingresa un email válido.') && ok;
    ok = setError('llegada', !llegada ? 'Elige la fecha de llegada.' : (llegada < hoy ? 'La fecha no puede ser pasada.' : '')) && ok;
    ok = setError('salida', !salida ? 'Elige la fecha de salida.' : (llegada && salida <= llegada ? 'La salida debe ser posterior a la llegada.' : '')) && ok;
    return ok;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validar()) return;

    const consulta = {
      nombre: $('#f-nombre').value.trim(),
      email: $('#f-email').value.trim(),
      llegada: $('#f-llegada').value,
      salida: $('#f-salida').value,
      habitacion: selectHab.value,
      mensaje: $('#f-mensaje').value.trim(),
      fecha: new Date().toISOString()
    };
    try {
      const key = 'casaserena_consultas';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      prev.push(consulta);
      localStorage.setItem(key, JSON.stringify(prev));
    } catch (err) { /* almacenamiento no disponible: la demo continúa */ }

    const success = $('#formSuccess');
    success.textContent = '¡Gracias, ' + consulta.nombre.split(' ')[0] + '! Te contactaremos dentro de las próximas 24 horas.';
    success.classList.add('show');
    form.reset();
    $$('.field', form).forEach(f => f.classList.remove('invalid'));
    setTimeout(() => success.classList.remove('show'), 8000);
  });

  // Limpia el error de un campo al corregirlo
  $$('input, select, textarea', form).forEach(el =>
    el.addEventListener('input', () => {
      const campo = el.id.replace('f-', '');
      const err = $('#err-' + campo);
      if (err && err.textContent) setError(campo, '');
    })
  );

  /* ---------- Botón volver arriba ---------- */
  const toTop = $('#toTop');
  window.addEventListener('scroll', () => { toTop.hidden = window.scrollY < 500; }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Año dinámico ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
