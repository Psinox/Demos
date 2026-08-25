'use strict';
/* ============================================================
   HOTEL COSTA AZUL — Motor de reservas (demo Plan Estándar)
   Módulos: datos · iconos · utilidades · precios · disponibilidad
   · calendario · resultados · builder · cupones · confirmación
   · galería · contacto · UI general
   ============================================================ */

/* ==================== 1. DATOS ==================== */
const HABITACIONES = [
  { id:'doble',    nombre:'Doble Estándar',     precio:45000,  maxPers:2, capacidad:'2 personas',   m2:26, unidades:8, extras:['Wi-Fi','TV 43"','Aire acondicionado','Caja fuerte'], icono:'cama',     g:['#8FC1E3','#0E6BA8'] },
  { id:'vistamar', nombre:'Doble Vista al Mar', precio:62000,  maxPers:2, capacidad:'2 personas',   m2:28, unidades:6, extras:['Balcón privado','Vista al mar','Minibar'],          icono:'mar',      g:['#2EC4B6','#0A2E4F'] },
  { id:'familiar', nombre:'Triple Familiar',    precio:78000,  maxPers:4, capacidad:'3–4 personas', m2:38, unidades:4, extras:['1 cama doble + 2 singles','Sofá cama'],             icono:'familia',  g:['#F2C879','#D97B4F'] },
  { id:'suite',    nombre:'Suite Premium',      precio:110000, maxPers:3, capacidad:'2–3 personas', m2:52, unidades:2, extras:['Jacuzzi','Terraza','King size','Cafetera Nespresso'], icono:'estrella', g:['#B7A6E0','#4A3B8C'] },
];

const COMIDAS = [
  { id:'ninguna',  nombre:'Solo alojamiento', precio:0,     desc:'Sin comidas incluidas',        icono:'cama',  g:['#A9BCCB','#3E5C76'] },
  { id:'desayuno', nombre:'Desayuno buffet',  precio:6000,  desc:'Todos los días 7:00 – 10:30',  icono:'cafe',  g:['#E8C07D','#8C5B2F'] },
  { id:'media',    nombre:'Media pensión',    precio:14000, desc:'Desayuno buffet + cena',       icono:'resto', g:['#7FB3D9','#0E6BA8'] },
  { id:'todo',     nombre:'Todo incluido',    precio:26000, desc:'Comidas, snacks y barra libre', icono:'copa', g:['#2EC4B6','#0A2E4F'] },
];

const ACTIVIDADES = [
  { id:'barco',   nombre:'Tour en barco',        precio:18000, desc:'2 horas navegando la bahía',      icono:'barco', g:['#7BE0D3','#0E6BA8'] },
  { id:'surf',    nombre:'Clase de surf',        precio:12000, desc:'90 minutos con instructor',       icono:'surf',  g:['#FFB199','#FF6B5B'] },
  { id:'spa',     nombre:'Spa & masaje',         precio:25000, desc:'50 minutos de relajación total',  icono:'spa',   g:['#D5B8E6','#6C4A8C'] },
  { id:'vinedos', nombre:'Excursión a viñedos',  precio:20000, desc:'Medio día con degustación',       icono:'vino',  g:['#A8C686','#4A6741'] },
];

const CUPONES = {
  VERANO10:      { pct:0.10, min:0 },
  FAMILIA15:     { pct:0.15, min:0 },
  LARGAESTANCIA: { pct:0.20, min:7 },
};

const TEMP_META = {
  alta:  { nombre:'Temporada Alta',  fechas:'15 dic – 28 feb',                  mult:1.30, etiqueta:'+30%' },
  media: { nombre:'Temporada Media', fechas:'1 mar – 30 jun · 1 sep – 14 dic',  mult:1.00, etiqueta:'Precio base' },
  baja:  { nombre:'Temporada Baja',  fechas:'1 jul – 31 ago',                   mult:0.85, etiqueta:'−15%' },
};

const GALERIA = [
  { cat:'habitaciones', titulo:'Doble Estándar',           icono:'cama',     g:['#8FC1E3','#0E6BA8'] },
  { cat:'habitaciones', titulo:'Doble Vista al Mar',       icono:'mar',      g:['#2EC4B6','#0A2E4F'] },
  { cat:'habitaciones', titulo:'Suite Premium',            icono:'estrella', g:['#B7A6E0','#4A3B8C'] },
  { cat:'piscina',      titulo:'Piscina infinita',         icono:'piscina',  g:['#7BE0D3','#0E6BA8'] },
  { cat:'piscina',      titulo:'Atardecer en el borde',    icono:'sol',      g:['#FFB199','#FF6B5B'] },
  { cat:'gastronomia',  titulo:'Restaurante Mar & Sal',    icono:'resto',    g:['#3E5C76','#0A2E4F'] },
  { cat:'gastronomia',  titulo:'Desayuno buffet',          icono:'cafe',     g:['#E8C07D','#8C5B2F'] },
  { cat:'exteriores',   titulo:'Fachada frente al mar',    icono:'edificio', g:['#0E6BA8','#0A2E4F'] },
  { cat:'exteriores',   titulo:'Jardines y palmeras',      icono:'palma',    g:['#8FD3A8','#1E7D5A'] },
  { cat:'exteriores',   titulo:'Terraza panorámica',       icono:'terraza',  g:['#B7A6E0','#4A3B8C'] },
];

const LS_RESERVAS = 'costaazul_reservas';
const LS_MENSAJES = 'costaazul_mensajes';

/* Estado global de la demo */
const estado = {
  busqueda: null,            // {llegada, salida, adultos, ninos, cupon}
  habitacionId: null,
  comidaId: 'ninguna',
  actividades: new Set(),
  ultimaActualizacion: null,
};
const calEstado = {};        // mes visible de cada mini-calendario {habId:{y,m}}

/* ==================== 2. ICONOS SVG ==================== */
const ICONOS = {
  cama:    '<path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/><path d="M3 18h18"/><path d="M5 11V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M7 11V9.5h4V11M13 11V9.5h4V11"/>',
  mar:     '<path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  familia: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.2"/><path d="M15.5 14.2c2.8.3 5 2.2 5 4.8"/>',
  estrella:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  piscina: '<path d="M2 17c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 21c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><circle cx="17" cy="6" r="3"/><path d="M8 13V6a2 2 0 0 1 4 0"/>',
  sol:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  resto:   '<path d="M7 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/><path d="M9 11v11"/><path d="M19 2c-1.7 1-2.5 3-2.5 5.5S17 12 19 12v10"/>',
  cafe:    '<path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M3 9h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M7 2v2M11 2v2M15 2v2"/>',
  edificio:'<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/><path d="M10 21v-3h4v3"/>',
  palma:   '<path d="M12 21v-6c0-4 1-7 1-7"/><path d="M13 8c-3-3-7-3-9-1 2.5 0 4 .5 5.5 1.5C7 7.5 5 9 4.5 12c2-.5 4-.7 6-.2"/><path d="M13 8c3-3 7-3 9-1-2.5 0-4 .5-5.5 1.5 2.5-1 4.5.5 5 3.5-2-.5-4-.7-6-.2"/><circle cx="11" cy="13" r="1.4"/><circle cx="14" cy="13.6" r="1.4"/>',
  terraza: '<path d="M3 20h18"/><path d="M5 20v-6M9.5 20v-6M14 20v-6M18.5 20v-6"/><path d="M3 14h18"/><circle cx="17" cy="5" r="2.4"/><path d="M17 1v1M21 5h1M13 5h-1"/>',
  barco:   '<path d="M4 17h16l-2.5 4h-11z"/><path d="M12 17V4"/><path d="M12 4c4 2 6 6 6 9h-6z"/><path d="M12 7C9.5 8.5 8 10.5 8 13h4z"/>',
  surf:    '<path d="M5 19c4 1 9-1 12-6l2.5-4.5L15 6l-4.5 2.5C7 10 5 14 5 19z"/><path d="M3 21c2 0 2-1.2 4-1.2s2 1.2 4 1.2"/>',
  spa:     '<path d="M12 20c-4.5 0-8-2.5-8-6 2.5 0 4.5.8 6 2.3C10.8 13 12 10 12 7c0 3 1.2 6 2 9.3 1.5-1.5 3.5-2.3 6-2.3 0 3.5-3.5 6-8 6z"/><path d="M12 7c0-2 .8-3.5 2-4.5"/>',
  vino:    '<path d="M7 3h10l-1 6a4 4 0 0 1-8 0z"/><path d="M12 13v6"/><path d="M8.5 21h7"/>',
  copa:    '<path d="M5 4h14l-7 8z"/><path d="M12 12v7"/><path d="M8.5 21h7"/><path d="M16 4l2-2"/>',
  check:   '<path d="M20 6 9 17l-5-5"/>',
  flechaI: '<path d="m15 18-6-6 6-6"/>',
  flechaD: '<path d="m9 18 6-6-6-6"/>',
};
function svgIcon(nombre){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre]||''}</svg>`;
}

/* ==================== 3. UTILIDADES ==================== */
const CLP = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];

function isoLocal(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function hoy(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function parseISO(s){ const[a,b,c]=s.split('-').map(Number); return new Date(a,b-1,c); }
function addDiasISO(s,n){ const d=parseISO(s); d.setDate(d.getDate()+n); return isoLocal(d); }
function nochesEntre(a,b){ return Math.round((parseISO(b)-parseISO(a))/86400000); }
function fechaLegible(s){ return parseISO(s).toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'}); }

/* Hash determinista (FNV-1a) para la simulación de disponibilidad */
function hashSemilla(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}

let toastTimer;
function toast(msg){
  const t=$('#toast');
  t.textContent=msg; t.hidden=false;
  requestAnimationFrame(()=>t.classList.add('ver'));
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{ t.classList.remove('ver'); setTimeout(()=>{t.hidden=true;},320); },2800);
}

/* ==================== 4. MOTOR DE PRECIOS ==================== */
/* Rangos mes-día: alta cruza año nuevo (15 dic – 28 feb) */
function temporadaKey(d){
  const md=(d.getMonth()+1)*100+d.getDate();
  if(md>=1215||md<=228) return 'alta';
  if(md>=701&&md<=831)  return 'baja';
  return 'media';
}
function precioNoche(hab,d){ return Math.round(hab.precio*TEMP_META[temporadaKey(d)].mult); }

/* Cotización prorrateada noche a noche según la temporada de cada fecha */
function cotizar(hab,desde,hasta){
  let total=0;
  const conteo={alta:0,media:0,baja:0};
  for(let d=desde; d<hasta; d=addDiasISO(d,1)){
    const fecha=parseISO(d);
    conteo[temporadaKey(fecha)]++;
    total+=precioNoche(hab,fecha);
  }
  const noches=nochesEntre(desde,hasta);
  return { total, conteo, noches, promedio:Math.round(total/noches) };
}
function textoDesglose(conteo){
  const partes=[];
  if(conteo.alta)  partes.push(`${conteo.alta} en temp. alta (+30%)`);
  if(conteo.media) partes.push(`${conteo.media} en temp. media`);
  if(conteo.baja)  partes.push(`${conteo.baja} en temp. baja (−15%)`);
  return partes.join(' · ');
}

/* ==================== 5. DISPONIBILIDAD (determinista) ==================== */
function getReservas(){
  try{ return JSON.parse(localStorage.getItem(LS_RESERVAS)||'[]'); }
  catch(e){ return []; }
}
/* Ocupación simulada estable: misma habitación+fecha = mismo resultado.
   ~35% de los días agotados; el resto entre 0 y unidades-1 ocupadas. */
function ocupadasSimuladas(hab,iso){
  const h=hashSemilla(hab.id+'|'+iso);
  if(h%100<35) return hab.unidades;
  return (h>>>7)%hab.unidades;
}
function ocupadasReales(habId,iso){
  return getReservas().filter(r=>r.habitacionId===habId && iso>=r.llegada && iso<r.salida).length;
}
function disponiblesDia(hab,iso){
  const ocupadas=Math.min(hab.unidades, ocupadasSimuladas(hab,iso)+ocupadasReales(hab.id,iso));
  return hab.unidades-ocupadas;
}
function disponiblesRango(hab,desde,hasta){
  let min=Infinity;
  for(let d=desde; d<hasta; d=addDiasISO(d,1)) min=Math.min(min,disponiblesDia(hab,d));
  return min;
}

/* ==================== 6. MINI-CALENDARIO ==================== */
function htmlCalendario(hab){
  if(!calEstado[hab.id]){ const h=hoy(); calEstado[hab.id]={y:h.getFullYear(),m:h.getMonth()}; }
  const st=calEstado[hab.id];
  const hoyD=hoy(), hoyStr=isoLocal(hoyD);
  const primero=new Date(st.y,st.m,1);
  const offset=(primero.getDay()+6)%7; // semana comienza en lunes
  const diasMes=new Date(st.y,st.m+1,0).getDate();
  const label=primero.toLocaleDateString('es-CL',{month:'long',year:'numeric'});
  const esActual=st.y===hoyD.getFullYear()&&st.m===hoyD.getMonth();

  let celdas='';
  for(let i=0;i<offset;i++) celdas+='<span class="cal-d vacio"></span>';
  for(let d=1;d<=diasMes;d++){
    const iso=isoLocal(new Date(st.y,st.m,d));
    let cls='', titulo='';
    if(iso<hoyStr){ cls='pasado'; }
    else{
      const disp=disponiblesDia(hab,iso);
      if(disp===0){ cls='agotado'; titulo='Agotado'; }
      else if(disp/hab.unidades<=0.3){ cls='pocas'; titulo=`Últimas ${disp} de ${hab.unidades}`; }
      else{ cls='disponible'; titulo=`${disp} de ${hab.unidades} disponibles`; }
      if(iso===hoyStr) cls+=' hoy';
      if(estado.busqueda && iso>=estado.busqueda.llegada && iso<estado.busqueda.salida) cls+=' en-rango';
    }
    celdas+=`<span class="cal-d ${cls}"${titulo?` title="${titulo}"`:''}>${d}</span>`;
  }
  return `
    <div class="cal-head">
      <button type="button" class="cal-nav cal-prev" data-hab="${hab.id}" ${esActual?'disabled':''} aria-label="Mes anterior">${svgIcon('flechaI')}</button>
      <strong>${label}</strong>
      <button type="button" class="cal-nav cal-next" data-hab="${hab.id}" aria-label="Mes siguiente">${svgIcon('flechaD')}</button>
    </div>
    <div class="cal-semana"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
    <div class="cal-dias">${celdas}</div>
    <div class="cal-leyenda">
      <span><i class="lg-verde"></i>Disponible</span>
      <span><i class="lg-ambar"></i>Últimas</span>
      <span><i class="lg-rojo"></i>Agotado</span>
    </div>`;
}
function navegarCal(habId,dir){
  const st=calEstado[habId]; if(!st) return;
  let m=st.m+dir, y=st.y;
  if(m<0){m=11;y--;} if(m>11){m=0;y++;}
  const h=hoy();
  if(y<h.getFullYear()||(y===h.getFullYear()&&m<h.getMonth())) return; // nunca antes del mes actual
  st.y=y; st.m=m;
  const caja=$(`.hab-card[data-hab="${habId}"] .hab-cal`);
  if(caja) caja.innerHTML=htmlCalendario(HABITACIONES.find(x=>x.id===habId));
}

/* ==================== 7. RESULTADOS ==================== */
function htmlCardHab(hab,i){
  const b=estado.busqueda;
  const cot=cotizar(hab,b.llegada,b.salida);
  const disp=disponiblesRango(hab,b.llegada,b.salida);
  const personas=b.adultos+b.ninos;
  const pctOcup=Math.round((hab.unidades-disp)/hab.unidades*100);
  const sinCapacidad=personas>hab.maxPers;
  const estadoTxt = disp===0 ? `<span class="agotado">Agotado en estas fechas</span>`
    : disp/hab.unidades<=0.3 ? `<span class="pocas">Quedan ${disp} de ${hab.unidades} · ¡Últimas unidades!</span>`
    : `<span class="ok">Quedan ${disp} de ${hab.unidades}</span>`;

  let boton;
  if(disp===0) boton=`<button type="button" class="btn btn-secundario btn-block" disabled>Sin disponibilidad</button>`;
  else if(sinCapacidad) boton=`<button type="button" class="btn btn-secundario btn-block" disabled>Capacidad máx. ${hab.maxPers} personas</button>`;
  else if(estado.habitacionId===hab.id) boton=`<button type="button" class="btn btn-coral btn-block btn-seleccionar" data-hab="${hab.id}">${svgIcon('check')} Seleccionada</button>`;
  else boton=`<button type="button" class="btn btn-primario btn-block btn-seleccionar" data-hab="${hab.id}">Seleccionar</button>`;

  const desglose=textoDesglose(cot.conteo);
  return `
  <article class="hab-card${estado.habitacionId===hab.id?' seleccionada':''}" data-hab="${hab.id}" style="--d:${i*0.08}s">
    <div class="hab-media" style="background:linear-gradient(135deg,${hab.g[0]},${hab.g[1]})">
      <span class="hab-icono">${svgIcon(hab.icono)}</span>
      <span class="hab-chip-m2">${hab.m2} m²</span>
    </div>
    <div class="hab-body">
      <div class="hab-top">
        <div>
          <h3>${hab.nombre}</h3>
          <p class="hab-meta">${hab.capacidad} · ${hab.unidades} unidades en el hotel</p>
        </div>
        <div class="hab-precio">
          <strong>${CLP.format(cot.promedio)}</strong>
          <small>promedio / noche</small>
        </div>
      </div>
      <div class="hab-extras">${hab.extras.map(e=>`<span>${e}</span>`).join('')}</div>
      <p class="hab-desglose" title="Tarifa prorrateada por noche — ${cot.noches} noches: ${desglose}">
        ${cot.noches} ${cot.noches===1?'noche':'noches'}: ${desglose}. Total alojamiento ${CLP.format(cot.total)}.
      </p>
      <div class="hab-disp">
        <p class="hab-disp-texto">${estadoTxt}<span>${pctOcup}% ocupado</span></p>
        <div class="disp-barra"><i class="${pctOcup>=70?'alta':''}" style="width:${pctOcup}%"></i></div>
      </div>
      <div class="hab-cal">${htmlCalendario(hab)}</div>
      ${boton}
    </div>
  </article>`;
}

function renderResultados(){
  const grid=$('#resultados');
  const b=estado.busqueda;
  if(!b){ grid.innerHTML=''; $('#estado-vacio').hidden=false; $('#ticker').hidden=true; return; }
  $('#estado-vacio').hidden=true; $('#ticker').hidden=false;
  const n=nochesEntre(b.llegada,b.salida);
  $('#resumen-busqueda').textContent=
    `Del ${fechaLegible(b.llegada)} al ${fechaLegible(b.salida)} · ${n} ${n===1?'noche':'noches'} · ${b.adultos} ${b.adultos===1?'adulto':'adultos'}${b.ninos?` · ${b.ninos} ${b.ninos===1?'niño':'niños'}`:''}`;
  grid.innerHTML=HABITACIONES.map((h,i)=>htmlCardHab(h,i)).join('');
}

function seleccionarHabitacion(id){
  estado.habitacionId=id;
  renderResultados();
  renderPaso1();
  renderResumen();
  document.querySelector('#paquetes').scrollIntoView({behavior:'smooth'});
  toast('Habitación seleccionada. Ahora arma tu paquete.');
}

/* ==================== 8. BUILDER ==================== */
function renderPaso1(){
  const c=$('#paso1-contenido');
  if(!estado.habitacionId||!estado.busqueda){
    $('#paso1-card').classList.remove('completo');
    c.innerHTML=`<div class="paso1-vacio">
      <span>Aún no has seleccionado una habitación.</span>
      <a href="#habitaciones" class="btn btn-secundario btn-chico">Ver habitaciones</a>
    </div>`;
    return;
  }
  $('#paso1-card').classList.add('completo');
  const t=calcularTotales();
  c.innerHTML=`<div class="paso1-sel">
    <div class="paso1-sel-info">
      <strong>${t.hab.nombre}</strong>
      <span>${fechaLegible(t.b.llegada)} → ${fechaLegible(t.b.salida)} · ${t.cot.noches} ${t.cot.noches===1?'noche':'noches'} · ${CLP.format(t.cot.promedio)} prom/noche</span>
    </div>
    <button type="button" class="btn btn-secundario btn-chico" id="btn-cambiar-hab">Cambiar</button>
  </div>`;
  $('#btn-cambiar-hab').addEventListener('click',()=>document.querySelector('#habitaciones').scrollIntoView({behavior:'smooth'}));
}

function renderComidas(){
  $('#lista-comidas').innerHTML=COMIDAS.map(c=>`
    <label class="comida-card">
      <input type="radio" name="comida" value="${c.id}" ${c.id===estado.comidaId?'checked':''}>
      <span class="comida-caja">
        <span class="comida-ico">${svgIcon(c.icono)}</span>
        <span><strong>${c.nombre}</strong><small>${c.desc}</small></span>
        <span class="comida-precio">${CLP.format(c.precio)}</span>
      </span>
    </label>`).join('');
}
function renderActividades(){
  $('#lista-actividades').innerHTML=ACTIVIDADES.map(a=>`
    <label class="act-card">
      <input type="checkbox" value="${a.id}" ${estado.actividades.has(a.id)?'checked':''}>
      <span class="act-caja">
        <span class="act-check">${svgIcon('check')}</span>
        <span><strong>${a.nombre}</strong><small>${a.desc}</small></span>
        <span class="act-precio">${CLP.format(a.precio)}</span>
      </span>
    </label>`).join('');
}

/* ==================== 9. RESUMEN + CUPONES ==================== */
function validarCupon(codigo,noches){
  if(!codigo) return {estado:'vacio'};
  const c=CUPONES[codigo.toUpperCase()];
  if(!c) return {estado:'invalido',msg:'Cupón no válido. Revisa el código.'};
  if(c.min&&noches<c.min) return {estado:'invalido',msg:`${codigo.toUpperCase()} requiere ${c.min} o más noches.`};
  return {estado:'ok',codigo:codigo.toUpperCase(),pct:c.pct};
}

function calcularTotales(){
  const b=estado.busqueda;
  const hab=HABITACIONES.find(h=>h.id===estado.habitacionId);
  if(!b||!hab) return null;
  const cot=cotizar(hab,b.llegada,b.salida);
  const personas=b.adultos+b.ninos;
  const comida=COMIDAS.find(c=>c.id===estado.comidaId);
  const comidasTotal=comida.precio*personas*cot.noches;
  const acts=ACTIVIDADES.filter(a=>estado.actividades.has(a.id));
  const actividadesTotal=acts.reduce((s,a)=>s+a.precio*personas,0);
  const subtotal=cot.total+comidasTotal+actividadesTotal;
  const cup=validarCupon(b.cupon,cot.noches);
  const descuento=cup.estado==='ok'?Math.round(subtotal*cup.pct):0;
  return { b, hab, cot, personas, comida, comidasTotal, acts, actividadesTotal, subtotal, cup, descuento, total:subtotal-descuento };
}

function renderResumen(){
  const t=calcularTotales();
  const caja=$('#res-lineas');
  const msg=$('#res-cupon-msg');
  const hint=$('#res-hint');
  msg.hidden=true; hint.hidden=true;
  $('#paso2-card').classList.toggle('completo',!!estado.busqueda);
  $('#paso3-card').classList.toggle('completo',estado.actividades.size>0);

  if(!t){
    caja.innerHTML='<p class="res-vacio">Busca fechas y selecciona una habitación para ver el detalle de tu paquete aquí.</p>';
    $('#res-total-fila').hidden=true;
    return;
  }
  const lineas=[];
  lineas.push(`<div class="res-linea"><span>Alojamiento · ${t.hab.nombre}<small>${t.cot.noches} ${t.cot.noches===1?'noche':'noches'} · ${textoDesglose(t.cot.conteo)}</small></span><strong>${CLP.format(t.cot.total)}</strong></div>`);
  if(t.comidasTotal>0) lineas.push(`<div class="res-linea"><span>${t.comida.nombre}<small>${t.personas} ${t.personas===1?'persona':'personas'} × ${t.cot.noches} días</small></span><strong>${CLP.format(t.comidasTotal)}</strong></div>`);
  t.acts.forEach(a=>lineas.push(`<div class="res-linea"><span>${a.nombre}<small>${t.personas} ${t.personas===1?'persona':'personas'} · pago único</small></span><strong>${CLP.format(a.precio*t.personas)}</strong></div>`));
  lineas.push(`<div class="res-linea res-subtotal"><span>Subtotal</span><strong>${CLP.format(t.subtotal)}</strong></div>`);
  if(t.descuento>0) lineas.push(`<div class="res-linea res-descuento"><span>Cupón ${t.cup.codigo} (−${t.cup.pct*100}%)</span><strong>−${CLP.format(t.descuento)}</strong></div>`);
  caja.innerHTML=lineas.join('');
  $('#res-total-fila').hidden=false;
  $('#res-total').textContent=CLP.format(t.total);

  if(t.b.cupon){
    msg.hidden=false;
    if(t.cup.estado==='ok'){ msg.textContent=`Cupón ${t.cup.codigo} aplicado correctamente.`; msg.className='res-cupon-msg ok'; }
    else{ msg.textContent=t.cup.msg; msg.className='res-cupon-msg err'; }
  }
  if(t.cot.noches>=7 && t.cup.codigo!=='LARGAESTANCIA') hint.hidden=false;
}

function aplicarCupon(codigo){
  if(!estado.busqueda){ toast('Primero busca tus fechas para aplicar un cupón.'); return; }
  const limpio=(codigo||'').trim().toUpperCase();
  estado.busqueda.cupon=limpio;
  $('#res-cupon').value=limpio;
  $('#w-cupon').value=limpio;
  renderResumen();
}

/* ==================== 10. CONFIRMACIÓN ==================== */
function generarCodigo(){
  const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s='';
  for(let i=0;i<5;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return `CAZ-${new Date().getFullYear()}-${s}`;
}

function abrirModal(){
  $('#modal-form').hidden=false;
  $('#modal-exito').hidden=true;
  $('#f-error').hidden=true;
  $('#modal').hidden=false;
  document.body.style.overflow='hidden';
  setTimeout(()=>$('#f-nombre').focus(),60);
}
function cerrarModal(){
  $('#modal').hidden=true;
  document.body.style.overflow='';
}

function htmlComprobante(r){
  const filas=[
    ['Huésped', r.cliente.nombre],
    ['Contacto', `${r.cliente.email} · ${r.cliente.fono}`],
    ['Habitación', r.habitacionNombre],
    ['Llegada', `${fechaLegible(r.llegada)} (desde 15:00)`],
    ['Salida', `${fechaLegible(r.salida)} (hasta 12:00)`],
    ['Noches', r.noches],
    ['Huéspedes', `${r.adultos} ${r.adultos===1?'adulto':'adultos'}${r.ninos?` + ${r.ninos} ${r.ninos===1?'niño':'niños'}`:''}`],
  ];
  const montos=[
    ['Alojamiento (ajustado por temporada)', CLP.format(r.alojamientoTotal)],
  ];
  if(r.comidasTotal>0) montos.push([r.comidaNombre, CLP.format(r.comidasTotal)]);
  if(r.actividadesTotal>0) montos.push([`Actividades (${r.actividadesNombres.join(', ')})`, CLP.format(r.actividadesTotal)]);
  return `
    <h4>Hotel Costa Azul — Comprobante de reserva</h4>
    <p class="comp-fecha">Código <b>${r.codigo}</b> · Emitido el ${new Date(r.creadaEn).toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'})}</p>
    ${filas.map(f=>`<div class="comp-linea"><span>${f[0]}</span><strong>${f[1]}</strong></div>`).join('')}
    <div class="comp-sep"></div>
    ${montos.map(m=>`<div class="comp-linea"><span>${m[0]}</span><strong>${m[1]}</strong></div>`).join('')}
    <div class="comp-linea"><span>Subtotal</span><strong>${CLP.format(r.subtotal)}</strong></div>
    ${r.descuento>0?`<div class="comp-linea comp-descuento"><span>Descuento cupón ${r.cupon}</span><strong>−${CLP.format(r.descuento)}</strong></div>`:''}
    <div class="comp-sep"></div>
    <div class="comp-total"><span>Total</span><span>${CLP.format(r.total)}</span></div>
    <p class="comp-nota">Cancelación gratuita hasta 72 horas antes del check-in.<br>Documento de demostración — Plan Estándar.</p>`;
}

function confirmarReserva(e){
  e.preventDefault();
  const nombre=$('#f-nombre').value.trim();
  const email=$('#f-email').value.trim();
  const fono=$('#f-fono').value.trim();
  const err=$('#f-error');
  const fallo=m=>{ err.textContent=m; err.hidden=false; };
  if(nombre.length<3) return fallo('Ingresa el nombre completo del huésped.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fallo('Ingresa un email válido.');
  if((fono.replace(/\D/g,'')).length<7) return fallo('Ingresa un teléfono válido (mínimo 7 dígitos).');
  err.hidden=true;

  const t=calcularTotales();
  if(!t){ cerrarModal(); toast('Tu búsqueda expiró. Vuelve a seleccionar una habitación.'); return; }

  const reserva={
    codigo:generarCodigo(),
    creadaEn:new Date().toISOString(),
    habitacionId:t.hab.id, habitacionNombre:t.hab.nombre,
    llegada:t.b.llegada, salida:t.b.salida, noches:t.cot.noches,
    adultos:t.b.adultos, ninos:t.b.ninos,
    comidaNombre:t.comida.nombre, comidasTotal:t.comidasTotal,
    actividadesNombres:t.acts.map(a=>a.nombre), actividadesTotal:t.actividadesTotal,
    alojamientoTotal:t.cot.total,
    subtotal:t.subtotal,
    cupon:t.cup.estado==='ok'?t.cup.codigo:null,
    descuento:t.descuento,
    total:t.total,
    cliente:{ nombre, email, fono },
  };
  const reservas=getReservas();
  reservas.push(reserva);
  try{ localStorage.setItem(LS_RESERVAS,JSON.stringify(reservas)); }
  catch(e2){ /* almacenamiento no disponible: la demo continúa sin persistir */ }

  $('#exito-codigo').textContent=reserva.codigo;
  $('#comprobante').innerHTML=htmlComprobante(reserva);
  $('#modal-form').hidden=true;
  $('#modal-exito').hidden=false;

  // Bloquear fechas de inmediato en la disponibilidad mostrada
  estado.ultimaActualizacion=Date.now();
  $('#ticker').innerHTML='<span class="ticker-punto"></span>Disponibilidad actualizada hace 0s';
  renderResultados();
  renderResumen();
}

/* ==================== 11. GALERÍA + LIGHTBOX ==================== */
let visibles=GALERIA.map((_,i)=>i);
let lbPos=0;

function renderGaleria(){
  $('#grid-galeria').innerHTML=GALERIA.map((g,i)=>`
    <button type="button" class="g-item" data-cat="${g.cat}" data-idx="${i}" style="background:linear-gradient(135deg,${g.g[0]},${g.g[1]})">
      <span class="g-icono">${svgIcon(g.icono)}</span>
      <span class="g-cap">${g.titulo}</span>
      <span class="g-cat">${g.cat}</span>
    </button>`).join('');
  requestAnimationFrame(()=>$$('.g-item').forEach(el=>el.classList.add('aparece')));
}
function filtrarGaleria(cat){
  $$('#filtros .filtro').forEach(b=>b.classList.toggle('activo',b.dataset.f===cat));
  visibles=[];
  $$('.g-item').forEach(el=>{
    const match=cat==='todas'||el.dataset.cat===cat;
    if(match){
      visibles.push(+el.dataset.idx);
      el.hidden=false;
      void el.offsetWidth; // reinicia la transición
      el.classList.add('aparece');
    }else{
      el.classList.remove('aparece');
      setTimeout(()=>{ if(!el.classList.contains('aparece')) el.hidden=true; },260);
    }
  });
}
function pintarLightbox(){
  const g=GALERIA[visibles[lbPos]];
  const img=$('#lb-img');
  img.style.background=`linear-gradient(135deg,${g.g[0]},${g.g[1]})`;
  img.innerHTML=`<span class="g-icono">${svgIcon(g.icono)}</span>`;
  $('#lb-cap').textContent=`${g.titulo} — ${g.cat}`;
}
function abrirLightbox(idx){
  lbPos=Math.max(0,visibles.indexOf(idx));
  pintarLightbox();
  $('#lightbox').hidden=false;
  document.body.style.overflow='hidden';
}
function cerrarLightbox(){
  $('#lightbox').hidden=true;
  document.body.style.overflow='';
}
function moverLightbox(d){
  if(!visibles.length) return;
  lbPos=(lbPos+d+visibles.length)%visibles.length;
  pintarLightbox();
}

/* ==================== 12. RENDER ESTÁTICO DINÁMICO ==================== */
function renderTemporadas(){
  $('#grid-temporadas').innerHTML=['alta','media','baja'].map(k=>{
    const t=TEMP_META[k];
    return `<article class="temp-card t-${k} reveal">
      <div class="temp-head"><h3>${t.nombre}</h3><span class="temp-badge">${t.etiqueta}</span></div>
      <p class="temp-fechas">${t.fechas}</p>
      <div class="temp-lista">
        ${HABITACIONES.map(h=>`<div><span>${h.nombre}</span><strong>${CLP.format(Math.round(h.precio*t.mult))}/noche</strong></div>`).join('')}
      </div>
    </article>`;
  }).join('');
}
function renderExperiencias(){
  $('#grid-comidas').innerHTML=COMIDAS.map(c=>`
    <article class="exp-card reveal">
      <div class="exp-media" style="background:linear-gradient(135deg,${c.g[0]},${c.g[1]})"><span class="exp-icono">${svgIcon(c.icono)}</span></div>
      <div class="exp-body"><strong>${c.nombre}</strong><small>${c.desc}</small>
      <span class="exp-precio">${CLP.format(c.precio)} <span>por persona / día</span></span></div>
    </article>`).join('');
  $('#grid-actividades').innerHTML=ACTIVIDADES.map(a=>`
    <article class="exp-card reveal">
      <div class="exp-media" style="background:linear-gradient(135deg,${a.g[0]},${a.g[1]})"><span class="exp-icono">${svgIcon(a.icono)}</span></div>
      <div class="exp-body"><strong>${a.nombre}</strong><small>${a.desc}</small>
      <span class="exp-precio">${CLP.format(a.precio)} <span>por persona</span></span></div>
    </article>`).join('');
}

/* ==================== 13. INICIALIZACIÓN Y EVENTOS ==================== */
(function init(){
  /* Widget: mínimos y valores por defecto */
  const hoyStr=isoLocal(hoy());
  const wL=$('#w-llegada'), wS=$('#w-salida');
  wL.min=hoyStr; wL.value=hoyStr;
  wS.min=addDiasISO(hoyStr,1); wS.value=addDiasISO(hoyStr,1);
  wL.addEventListener('change',()=>{
    if(!wL.value) return;
    const minS=addDiasISO(wL.value,1);
    wS.min=minS;
    if(wS.value<=wL.value) wS.value=minS;
  });

  /* Búsqueda */
  $('#widget').addEventListener('submit',e=>{
    e.preventDefault();
    const err=$('#w-error'); err.hidden=true;
    const fallo=m=>{ err.textContent=m; err.hidden=false; };
    const l=wL.value, s=wS.value;
    if(!l||!s) return fallo('Selecciona las fechas de llegada y salida.');
    if(l<hoyStr) return fallo('La fecha de llegada no puede ser anterior a hoy.');
    if(s<=l) return fallo('La fecha de salida debe ser posterior a la llegada.');
    const n=nochesEntre(l,s);
    if(n>30) return fallo('La estadía máxima es de 30 noches.');

    estado.busqueda={ llegada:l, salida:s, adultos:+$('#w-adultos').value, ninos:+$('#w-ninos').value, cupon:$('#w-cupon').value.trim().toUpperCase() };
    estado.ultimaActualizacion=Date.now();
    $('#res-cupon').value=estado.busqueda.cupon;
    $('#ticker').innerHTML='<span class="ticker-punto"></span>Disponibilidad actualizada hace 0s';
    renderResultados(); renderPaso1(); renderResumen();
    document.querySelector('#habitaciones').scrollIntoView({behavior:'smooth'});
  });

  /* Delegación en resultados: calendario + seleccionar */
  $('#resultados').addEventListener('click',e=>{
    const btn=e.target.closest('button'); if(!btn) return;
    if(btn.classList.contains('cal-prev'))  return navegarCal(btn.dataset.hab,-1);
    if(btn.classList.contains('cal-next'))  return navegarCal(btn.dataset.hab,1);
    if(btn.classList.contains('btn-seleccionar')) return seleccionarHabitacion(btn.dataset.hab);
  });

  /* Builder: comidas y actividades */
  $('#lista-comidas').addEventListener('change',e=>{
    if(e.target.name==='comida'){ estado.comidaId=e.target.value; renderResumen(); }
  });
  $('#lista-actividades').addEventListener('change',e=>{
    const id=e.target.value;
    if(e.target.checked) estado.actividades.add(id); else estado.actividades.delete(id);
    renderResumen();
  });

  /* Cupón en el resumen */
  $('#btn-aplicar-cupon').addEventListener('click',()=>aplicarCupon($('#res-cupon').value));
  $('#res-cupon').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); aplicarCupon($('#res-cupon').value); } });
  $('#btn-hint-aplicar').addEventListener('click',()=>{ aplicarCupon('LARGAESTANCIA'); toast('Cupón LARGAESTANCIA aplicado: −20%.'); });
  $$('.cupon-chip').forEach(ch=>ch.addEventListener('click',()=>{
    aplicarCupon(ch.dataset.cupon);
    toast(`Cupón ${ch.dataset.cupon} cargado en tu reserva.`);
  }));

  /* Confirmar */
  $('#btn-confirmar').addEventListener('click',()=>{
    if(!estado.busqueda){
      toast('Primero busca tus fechas en el buscador.');
      document.querySelector('#widget').scrollIntoView({behavior:'smooth'}); return;
    }
    if(!estado.habitacionId){
      toast('Selecciona una habitación en los resultados.');
      document.querySelector('#habitaciones').scrollIntoView({behavior:'smooth'}); return;
    }
    const t=calcularTotales();
    if(t.personas>t.hab.maxPers){ toast(`La ${t.hab.nombre} tiene capacidad máxima de ${t.hab.maxPers} personas.`); return; }
    if(disponiblesRango(t.hab,t.b.llegada,t.b.salida)<=0){
      toast('La habitación seleccionada se agotó en esas fechas. Elige otra.');
      renderResultados(); return;
    }
    abrirModal();
  });
  $('#form-reserva').addEventListener('submit',confirmarReserva);
  $$('#modal [data-cerrar]').forEach(el=>el.addEventListener('click',cerrarModal));
  $('#btn-aceptar').addEventListener('click',()=>{
    cerrarModal();
    toast('Reserva registrada: las fechas quedaron bloqueadas en el calendario.');
    document.querySelector('#habitaciones').scrollIntoView({behavior:'smooth'});
  });
  $('#btn-imprimir').addEventListener('click',()=>window.print());

  /* Galería */
  $('#filtros').addEventListener('click',e=>{
    const b=e.target.closest('.filtro'); if(!b) return;
    filtrarGaleria(b.dataset.f);
  });
  $('#grid-galeria').addEventListener('click',e=>{
    const item=e.target.closest('.g-item'); if(!item||item.hidden) return;
    abrirLightbox(+item.dataset.idx);
  });
  $$('#lightbox [data-lb-cerrar]').forEach(el=>el.addEventListener('click',cerrarLightbox));
  $('#lb-prev').addEventListener('click',()=>moverLightbox(-1));
  $('#lb-next').addEventListener('click',()=>moverLightbox(1));

  /* Teclado global */
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(!$('#lightbox').hidden){ cerrarLightbox(); return; }
      if(!$('#modal').hidden){ cerrarModal(); return; }
      const h=$('#header');
      if(h.classList.contains('menu-abierto')){ h.classList.remove('menu-abierto'); document.body.style.overflow=''; $('#btnMenu').setAttribute('aria-expanded','false'); }
    }
    if(!$('#lightbox').hidden){
      if(e.key==='ArrowRight') moverLightbox(1);
      if(e.key==='ArrowLeft')  moverLightbox(-1);
    }
  });

  /* Formulario de contacto */
  $('#form-contacto').addEventListener('submit',e=>{
    e.preventDefault();
    const nombre=$('#c-nombre').value.trim();
    const email=$('#c-email').value.trim();
    const mensaje=$('#c-mensaje').value.trim();
    const err=$('#c-error'), ok=$('#c-ok');
    ok.hidden=true; err.hidden=true;
    const fallo=m=>{ err.textContent=m; err.hidden=false; };
    if(nombre.length<3) return fallo('Ingresa tu nombre.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fallo('Ingresa un email válido.');
    if(mensaje.length<10) return fallo('Cuéntanos un poco más (mínimo 10 caracteres).');
    try{
      const lista=JSON.parse(localStorage.getItem(LS_MENSAJES)||'[]');
      lista.push({fecha:new Date().toISOString(),nombre,email,mensaje});
      localStorage.setItem(LS_MENSAJES,JSON.stringify(lista));
    }catch(e2){ /* sin persistencia disponible */ }
    e.target.reset();
    ok.hidden=false;
    setTimeout(()=>{ ok.hidden=true; },7000);
  });

  /* Header con blur al hacer scroll */
  window.addEventListener('scroll',()=>{
    $('#header').classList.toggle('scrolled',window.scrollY>10);
  },{passive:true});

  /* Menú hamburguesa */
  $('#btnMenu').addEventListener('click',()=>{
    const h=$('#header');
    const abierto=h.classList.toggle('menu-abierto');
    $('#btnMenu').setAttribute('aria-expanded',String(abierto));
    $('#btnMenu').setAttribute('aria-label',abierto?'Cerrar menú':'Abrir menú');
    document.body.style.overflow=abierto?'hidden':'';
  });
  $$('.nav a').forEach(a=>a.addEventListener('click',()=>{
    $('#header').classList.remove('menu-abierto');
    $('#btnMenu').setAttribute('aria-expanded','false');
    document.body.style.overflow='';
  }));

  /* FAQ acordeón */
  $$('.faq-item').forEach(item=>{
    const q=item.querySelector('.faq-q');
    const a=item.querySelector('.faq-a');
    q.addEventListener('click',()=>{
      const abierto=item.classList.contains('abierto');
      $$('.faq-item').forEach(i=>{
        i.classList.remove('abierto');
        i.querySelector('.faq-q').setAttribute('aria-expanded','false');
        i.querySelector('.faq-a').style.maxHeight='';
      });
      if(!abierto){
        item.classList.add('abierto');
        q.setAttribute('aria-expanded','true');
        a.style.maxHeight=a.scrollHeight+'px';
      }
    });
  });

  /* Ticker de disponibilidad: refresca el contador cada 15 s */
  setInterval(()=>{
    if(!estado.ultimaActualizacion) return;
    const s=Math.floor((Date.now()-estado.ultimaActualizacion)/1000);
    $('#ticker').innerHTML=`<span class="ticker-punto"></span>Disponibilidad actualizada hace ${s}s`;
  },15000);

  /* Año dinámico */
  $('#anio').textContent=new Date().getFullYear();

  /* Renders iniciales (antes de activar el observer para animarlos) */
  renderTemporadas();
  renderExperiencias();
  renderGaleria();
  renderComidas();
  renderActividades();
  renderPaso1();
  renderResumen();

  /* Animaciones reveal */
  const io=new IntersectionObserver(entradas=>{
    entradas.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  },{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));
})();
