/* =============================================
   MAKRO — PACK DE GUIONES — app.js
   El frontend le pega a /.netlify/functions/generar
   La API key vive segura en el servidor de Netlify.
   ============================================= */

// ---- NAVIGATION ----
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

// ---- LOADING MESSAGES ----
const loadingMessages = [
  'Analizando tu idea…',
  'Armando los objetivos de comunicación…',
  'Definiendo los requerimientos de producción…',
  'Escribiendo el guion…',
  'Ajustando el tono argentino…',
  'Casi listo…'
];

function animateLoading() {
  const bar = document.getElementById('loadingBar');
  const msg = document.getElementById('loadingMsg');
  let step = 0;

  const interval = setInterval(() => {
    if (step < loadingMessages.length) {
      const pct = Math.round((step / (loadingMessages.length - 1)) * 85);
      bar.style.width = pct + '%';
      msg.textContent = loadingMessages[step];
      step++;
    }
  }, 900);

  return interval;
}

function finishLoading(interval) {
  clearInterval(interval);
  document.getElementById('loadingBar').style.width = '100%';
  document.getElementById('loadingMsg').textContent = '¡Pack listo!';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- GENERATE ----
async function generarGuion() {
  const idea       = document.getElementById('idea').value.trim();
  const categoria  = document.getElementById('categoria').value.trim();
  const tono       = document.getElementById('tono').value;
  const duracion   = document.getElementById('duracion').value;
  const plataforma = document.getElementById('plataforma').value;
  const referencia = document.getElementById('referencia').value.trim();

  // Validación
  const errorEl = document.getElementById('error-msg');
  if (!idea) {
    errorEl.textContent = 'Por favor completá tu idea antes de continuar.';
    errorEl.classList.remove('hidden');
    document.getElementById('idea').focus();
    return;
  }
  errorEl.classList.add('hidden');

  // Ir a loading
  goTo('screen-loading');
  const loadInterval = animateLoading();

  try {
    // ⬇️ Acá está la diferencia clave: le pegamos a NUESTRA función en Netlify
    const res = await fetch('/.netlify/functions/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, categoria, tono, duracion, plataforma, referencia })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${res.status}`);
    }

    const pack = await res.json();

    finishLoading(loadInterval);
    await sleep(500);

    renderResult(pack, { idea, categoria, tono, duracion, plataforma, referencia });
    goTo('screen-result');

  } catch (err) {
    finishLoading(loadInterval);
    console.error('Error:', err);
    await sleep(400);
    goTo('screen-form');

    const errorEl = document.getElementById('error-msg');
    errorEl.textContent = `Error: ${err.message}. Verificá tu conexión o la configuración de la API key en Netlify.`;
    errorEl.classList.remove('hidden');
  }
}

// ---- RENDER RESULT ----
function renderResult(pack, meta) {
  const container = document.getElementById('result-container');

  const instHtml = pack.instancias.map(inst => {
    const badgeClass = inst.tipo === 'hook' ? 'badge-hook' : inst.tipo === 'cta' ? 'badge-cta' : 'badge-dev';
    return `
      <div class="inst-card">
        <div class="inst-card-top">
          <div>
            <span class="inst-badge ${badgeClass}">${inst.nombre}</span>
            <div class="inst-duracion">${inst.duracion}</div>
          </div>
          <div class="inst-num">${inst.numero}</div>
        </div>
        <div class="inst-section">
          <div class="inst-section-label">En pantalla</div>
          <div class="inst-section-text">${inst.accion_pantalla}</div>
        </div>
        <div class="inst-section">
          <div class="inst-section-label">Diálogo / texto</div>
          <div class="inst-section-text inst-dialogo">${inst.dialogo}</div>
        </div>
        <div class="inst-section">
          <div class="inst-section-label">Plano / shot</div>
          <div class="inst-section-text">${inst.descripcion_visual}</div>
        </div>
      </div>
    `;
  }).join('');

  const objetivosHtml = pack.objetivos.map(o => `<li>${o}</li>`).join('');
  const reqHtml       = pack.requerimientos.map(r => `<li>${r}</li>`).join('');

  const refHtml = meta.referencia
    ? `<div class="ref-text">${pack.referencia_visual}</div>
       <a href="${meta.referencia}" target="_blank" class="ref-link">↗ Ver referencia</a>`
    : `<div class="ref-text">${pack.referencia_visual}</div>`;

  container.innerHTML = `
    <div class="pack-title-section">
      <div class="pack-eyebrow">Pack generado · Makro Argentina</div>
      <h2 class="pack-video-title">${pack.titulo}</h2>
      <div class="pack-meta-row">
        <span class="meta-tag">${meta.duracion}</span>
        <span class="meta-tag">${meta.plataforma}</span>
        <span class="meta-tag">${meta.tono}</span>
        ${meta.categoria ? `<span class="meta-tag">${meta.categoria}</span>` : ''}
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-block-label">Objetivos de comunicación</div>
        <ul class="info-list">${objetivosHtml}</ul>
      </div>
      <div class="info-block">
        <div class="info-block-label">Requerimientos de producción</div>
        <ul class="info-list req-list">${reqHtml}</ul>
      </div>
      <div class="info-block full-width">
        <div class="info-block-label">Referencia visual</div>
        ${refHtml}
      </div>
    </div>

    <div class="instancias-label">Guion — 4 instancias</div>
    <div class="instancias-grid">
      ${instHtml}
    </div>
  `;
}

// ---- EXPORT (imprime la pantalla de resultado) ----
function exportarPDF() {
  window.print();
}
