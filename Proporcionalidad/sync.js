/* Cola de resultados de proporcionalidad para el receptor Apps Script común. */
(function (root) {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwCn-S93OX699xcHUEh9MguMxAijRNBrXwr3Mb0Ir7iBkmCY-ftWJDc5HfA339vnE7N/exec';
  const RESOURCE = '04Proporcionalidad';
  const QUEUE = 'ud4-proporcionalidad-envios-v1';
  const DONE = 'ud4-proporcionalidad-confirmados-v1';
  const RETRY_MS = 60 * 60 * 1000;
  let busy = false;
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const status = message => { const node = document.getElementById('sync-status'); if (node) node.textContent = message; };
  const plain = html => String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const isStudy = name => String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es') === 'estudiar';
  function payload({ name, stage, state }) {
    const practice = state.history || [], exit = state.exitAnswers || [];
    const all = [...practice, ...exit];
    return {
      version: 3, resource: RESOURCE, id: state.syncId, clientTime: new Date().toISOString(),
      name: String(name || '').trim().replace(/\s+/g, ' '), stage, attempt: state.attempt,
      practiceTotal: practice.length, practiceCorrect: practice.filter(x => x.main).length,
      practiceFull: practice.filter(x => x.full).length, hints: practice.filter(x => x.hint).length,
      exitTotal: exit.length, exitCorrect: exit.filter(x => x.main).length,
      exitFull: exit.filter(x => x.full).length, level: state.result.level,
      high: !!state.result.high, provisional: !!state.result.provisional,
      reason: String(state.result.reason || ''), stats: state.stats || {},
      exercises: all.map((x, i) => ({
        position: i + 1, phase: x.phase, statement: plain(x.q.text), answer: String(x.entered),
        review: `${plain(x.q.text)} Respuesta correcta: ${x.q.answer}. ${x.q.explanation ? plain(x.q.explanation) : ''}`,
        correct: !!x.main, full: !!x.full, hinted: !!x.hint,
        stepCorrect: x.q.step ? !!x.step : null, selectedStep: x.selectedStep || '',
        simplified: null, topic: x.q.family, errorTag: x.q.step && !x.step ? 'clasificación' : !x.main ? 'cálculo' : ''
      }))
    };
  }
  const ready = () => /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(ENDPOINT);
  function receipt(id) {
    return new Promise(resolve => {
      const callback = '__adaptativoReceipt_' + id.replace(/-/g, '');
      const script = document.createElement('script'); let timer;
      const finish = found => { clearTimeout(timer); delete root[callback]; script.remove(); resolve(found); };
      root[callback] = response => finish(response?.id === id && response?.stored === true);
      script.onerror = () => finish(false);
      script.src = `${ENDPOINT}?action=receipt&resource=${RESOURCE}&id=${encodeURIComponent(id)}&callback=${callback}&_=${Date.now()}`;
      timer = setTimeout(() => finish(false), 12000);
      document.head.append(script);
    });
  }
  async function flush() {
    if (busy || !ready() || !navigator.onLine) return;
    busy = true;
    try {
      const queue = read(QUEUE, []);
      for (const item of Array.isArray(queue) ? queue : []) {
        let stored = await receipt(item.id);
        if (!stored && (!item.lastPostAt || Date.now() - item.lastPostAt >= RETRY_MS)) {
          try {
            await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(item) });
            item.lastPostAt = Date.now(); write(QUEUE, queue);
            stored = await receipt(item.id);
          } catch { /* Se conserva la cola para volver a intentarlo. */ }
        }
        if (!stored) { status('Envío pendiente de confirmación; se reintentará al volver a conectar.'); break; }
        write(QUEUE, read(QUEUE, []).filter(x => x.id !== item.id));
        const done = read(DONE, []); if (!done.includes(item.id)) write(DONE, [...done, item.id].slice(-500));
        status('Resultado enviado al profesor.');
      }
    } finally { busy = false; }
  }
  function record(data) {
    if (!data.state?.result || !data.state?.syncId || isStudy(data.name)) return;
    const done = read(DONE, []); if (done.includes(data.state.syncId)) return;
    const queue = read(QUEUE, []);
    if (!queue.some(x => x.id === data.state.syncId)) {
      queue.push(payload(data));
      if (!write(QUEUE, queue)) { status('No se pudo guardar el resultado en este navegador.'); return; }
    }
    status('Guardando resultado…'); flush();
  }
  root.ProportionSync = { record, flush };
  if (typeof window !== 'undefined') {
    window.addEventListener('online', flush);
    window.addEventListener('focus', flush);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) flush(); });
    setTimeout(flush, 1200);
  }
})(typeof window !== 'undefined' ? window : globalThis);

