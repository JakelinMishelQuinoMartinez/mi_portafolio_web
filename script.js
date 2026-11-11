// Atajos para seleccionar elementos
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;

// Tema oscuro/claro con preferencia guardada
const btnTema = $('#tema');
const aplicarTema = t => { root.dataset.theme = t; btnTema.textContent = t === 'dark' ? '☀' : '☾'; };
aplicarTema(root.dataset.theme);
btnTema.addEventListener('click', () => {
  const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('tema', t); } catch {}
  aplicarTema(t);
});

// Menú móvil
$('#menu').addEventListener('click', () => $('#nav').classList.toggle('abierto'));
$$('#nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('abierto')));

// Mensaje de arranque estilo terminal (guiño a Matrix)
function escribirTexto(el, texto, vel, fin) {
  let i = 0;
  const t = setInterval(() => {
    el.textContent = texto.slice(0, ++i);
    if (i >= texto.length) { clearInterval(t); fin && fin(); }
  }, vel);
}
const boot = $('#boot');
escribirTexto(boot, 'Despierta, Jaki...', 70, () =>
  setTimeout(() => escribirTexto(boot, 'Bienvenido a mi portafolio.', 45), 900));

// Efecto de escritura con los roles
const frases = ['Desarrolladora Frontend','Desarrolladora Backend', 'Base de Datos','Desarrolladora Full Stack'];
const typed = $('#typed');
let f = 0, c = 0, borrando = false;
function ciclo() {
  const frase = frases[f];
  typed.textContent = frase.slice(0, c);
  c += borrando ? -1 : 1;
  let espera = borrando ? 40 : 85;
  if (!borrando && c > frase.length) { borrando = true; espera = 1400; }
  else if (borrando && c < 0) { borrando = false; f = (f + 1) % frases.length; c = 0; espera = 300; }
  setTimeout(ciclo, espera);
}
ciclo();

// Aparición de elementos al hacer scroll
const observador = new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    observador.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => observador.observe(el));

// Filtro de habilidades técnicas por categoría.
// Al elegir Backend o Frontend también se muestran los frameworks de esa área (data-also).
const gruposHabilidades = $$('.grupo');
const perteneceA = (item, categoria) => (item.dataset.also || '').split(' ').includes(categoria);

function filtrarHabilidades(categoria) {
  gruposHabilidades.forEach(g => {
    const items = $$('.tech', g);
    const esArea = g.dataset.cat === categoria;
    const esFrameworks = g.dataset.cat === 'fw';

    // Vista general o grupo propio: todo visible
    if (categoria === 'todas' || esArea) {
      g.classList.remove('oculto');
      items.forEach(t => t.classList.remove('oculta'));
      return;
    }

    // Frameworks: muestra solo los que pertenecen al área seleccionada
    if (esFrameworks) {
      const propios = items.filter(t => perteneceA(t, categoria));
      g.classList.toggle('oculto', propios.length === 0);
      items.forEach(t => t.classList.toggle('oculta', !perteneceA(t, categoria)));
      return;
    }

    g.classList.add('oculto');
  });
}

$$('.filtro').forEach(btn => btn.addEventListener('click', () => {
  $$('.filtro').forEach(b => {
    const activo = b === btn;
    b.classList.toggle('activo', activo);
    b.setAttribute('aria-pressed', activo);
  });
  filtrarHabilidades(btn.dataset.cat);
}));

// Resalta el enlace activo según la sección visible
const enlaces = $$('.nav a');
const vigia = new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (e.isIntersecting) enlaces.forEach(a => a.classList.toggle('activo', a.hash === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section').forEach(s => vigia.observe(s));

// Barra de progreso y botón de subir
const subir = $('#subir');
addEventListener('scroll', () => {
  const max = document.body.scrollHeight - innerHeight;
  $('#progress').style.width = (scrollY / max * 100) + '%';
  subir.classList.toggle('ver', scrollY > 500);
}, { passive: true });
subir.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

// Resplandor que sigue al cursor
addEventListener('pointermove', e => {
  root.style.setProperty('--mx', e.clientX + 'px');
  root.style.setProperty('--my', e.clientY + 'px');
});

// Lluvia de caracteres estilo Matrix en los dos bordes.
// El CSS se encarga de desvanecerla hacia el centro, así el contenido queda limpio.
(() => {
  const lienzo = $('#matrix');
  if (!lienzo) return;
  const ctx = lienzo.getContext('2d');
  const GLIFOS = '01000100 01101001 01101111 01110011 00100000 01110100 01100101 00100000 01100001 01101101 01100001';
  const TAM = 15;        // alto de cada glifo
  const PASO = TAM * 1.2;
  const ZONA = 0.2;      // ancho que ocupa cada borde
  const ESTELA = 14;     // glifos que deja cada columna
  const menosMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

  let ancho = 0, alto = 0, columnas = [], cuerpo = '#3dff8f', cabeza = '#f1ead9';
  let ultimo = 0, raf = 0;

  const glifo = () => GLIFOS[Math.floor(Math.random() * GLIFOS.length)];

  const leerColores = () => {
    const estilos = getComputedStyle(root);
    cuerpo = estilos.getPropertyValue('--neon').trim() || '#3dff8f';
    cabeza = estilos.getPropertyValue('--crema').trim() || '#f1ead9';
  };

  const nuevaColumna = (x, y) => ({
    x,
    y: y ?? -Math.random() * alto,
    vel: 45 + Math.random() * 110,
    glifos: Array.from({ length: ESTELA }, glifo)
  });

  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ancho = innerWidth;
    alto = innerHeight;
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `700 ${TAM}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const porLado = Math.max(3, Math.floor((ancho * ZONA) / PASO));
    const inicioDerecha = ancho - porLado * PASO;
    columnas = [];
    for (let i = 0; i < porLado; i++) {
      columnas.push(nuevaColumna(i * PASO + PASO / 2));
      columnas.push(nuevaColumna(inicioDerecha + i * PASO + PASO / 2));
    }
  }

  function pintar(dt) {
    ctx.clearRect(0, 0, ancho, alto);
    for (const col of columnas) {
      col.y += col.vel * dt;
      if (col.y - ESTELA * PASO > alto) {
        col.y = -Math.random() * alto * 0.4;
        col.vel = 26 + Math.random() * 60;
      }
      for (let k = 0; k < ESTELA; k++) {
        const y = col.y - k * PASO;
        if (y < -TAM || y > alto) continue;
        if (Math.random() < 0.015) col.glifos[k] = glifo();
        ctx.globalAlpha = k === 0 ? 1 : (1 - k / ESTELA) * 0.72;
        ctx.fillStyle = k === 0 ? cabeza : cuerpo;
        ctx.fillText(col.glifos[k], col.x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function animar(ts) {
    raf = requestAnimationFrame(animar);
    if (document.hidden) { ultimo = ts; return; }
    const dt = Math.min((ts - (ultimo || ts)) / 1000, 0.05);
    ultimo = ts;
    pintar(dt);
  }

  function iniciar() {
    leerColores();
    medir();
    cancelAnimationFrame(raf);
    if (menosMovimiento.matches) {
      // Sin animación: un solo cuadro estático
      columnas.forEach(col => { col.y = Math.random() * alto; });
      pintar(0);
      return;
    }
    ultimo = 0;
    raf = requestAnimationFrame(animar);
  }

  addEventListener('resize', iniciar, { passive: true });
  menosMovimiento.addEventListener('change', iniciar);
  new MutationObserver(leerColores).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  iniciar();
})();

// Copiar correo al portapapeles
$('#copiar').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('quinojakelin@gmail.com'); } catch {}
  const toast = $('#toast');
  toast.classList.add('ver');
  setTimeout(() => toast.classList.remove('ver'), 2000);
});

// Año actual en el pie de página
$('#anio').textContent = new Date().getFullYear();