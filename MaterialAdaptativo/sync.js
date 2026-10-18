/* Sincronización de resúmenes de intentos con Apps Script. */
(() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwCn-S93OX699xcHUEh9MguMxAijRNBrXwr3Mb0Ir7iBkmCY-ftWJDc5HfA339vnE7N/exec';
  const QUEUE_KEY = 'ud2-adaptativo-envios-v1';
  const DONE_KEY = 'ud2-adaptativo-confirmados-v1';
  const MAX_DONE = 500;
  const POST_RETRY_MS = 60 * 60 * 1000;
  let busy = false;
  let rerun = false;
  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback } catch { return fallback }
  };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false } };
  const id = () => crypto.randomUUID();
  const ready = () => ENDPOINT.startsWith('https://script.google.com/macros/s/') && ENDPOINT.endsWith('/exec');
  function status(message, kind = '') {
    const result = document.getElementById('view-result');
    if (!result) return;
    let node = document.getElementById('sync-status');
    if (!node) {
      node = document.createElement('p'); node.id = 'sync-status'; node.setAttribute('role', 'status');
      node.style.cssText = 'margin:12px 0;padding:9px 12px;border:1px solid #cbdde1;border-radius:9px;background:#f4f8f9;font-weight:700';
      result.appendChild(node);
    }
    node.textContent = message;
    node.dataset.kind = kind;
  }
  function makePayload({ name, stage, state }) {
    const practice = state.history || [], exit = state.exitAnswers || [];
    return {
      version: 1, id: state.syncId, clientTime: new Date().toISOString(),
      name: String(name || '').trim().replace(/\s+/g, ' '), stage, attempt: state.attempt || 1,
      practiceTotal: practice.length, practiceCorrect: practice.filter(x => x.correct).length,
      practiceFull: practice.filter(x => x.full).length, hints: practice.filter(x => x.hinted).length,
      exitTotal: exit.length, exitCorrect: exit.filter(x => x.correct).length,
      exitFull: exit.filter(x => x.full).length, level: state.result.level,
      high: !!state.result.high, provisional: !!state.result.provisional,
      reason: String(state.result.reason || ''), stats: state.stats || {}
    };
  }
  function receipt(attemptId) {
    return new Promise(resolve => {
      const callback = '__adaptativoReceipt_' + attemptId.replace(/-/g, '');
      const script = document.createElement('script');
      let timer;
      const finish = found => { clearTimeout(timer); delete window[callback]; script.remove(); resolve(found) };
      window[callback] = response => finish(response?.id === attemptId && response?.stored === true);
      script.onerror = () => finish(false);
      script.src = `${ENDPOINT}?action=receipt&id=${encodeURIComponent(attemptId)}&callback=${callback}&_=${Date.now()}`;
      timer = setTimeout(() => finish(false), 12000);
      document.head.appendChild(script);
    });
  }
  async function flush() {
    if (busy) { rerun = true; return }
    if (!ready() || !navigator.onLine) return;
    busy = true;
    try {
      let queue = read(QUEUE_KEY, []);
      if (!Array.isArray(queue)) queue = [];
      for (const item of queue) {
        let stored = await receipt(item.id);
        const sentRecently = Number(item.lastPostAt) > 0 && Date.now() - item.lastPostAt < POST_RETRY_MS;
        if (!stored && !sentRecently) {
          try {
            await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(item) });
            const latest = read(QUEUE_KEY, []);
            if (Array.isArray(latest)) {
              const current = latest.find(x => x.id === item.id);
              if (current) { current.lastPostAt = Date.now(); write(QUEUE_KEY, latest) }
            }
            item.lastPostAt = Date.now();
            stored = await receipt(item.id);
          } catch { /* Se reintentará después. */ }
        }
        if (stored) {
          const latest = read(QUEUE_KEY, []);
          queue = (Array.isArray(latest) ? latest : queue).filter(x => x.id !== item.id);
          write(QUEUE_KEY, queue);
          const oldDone = read(DONE_KEY, []);
          const done = Array.isArray(oldDone) ? oldDone : [];
          if (!done.includes(item.id)) { done.push(item.id); write(DONE_KEY, done.slice(-MAX_DONE)) }
          status('Intento guardado en la hoja de la profesora.', 'saved');
        } else {
          status(item.lastPostAt
            ? 'Solicitud enviada, pero Google no confirma la recepción desde este navegador. Pide a la profesora que compruebe la hoja. Si tienes varias cuentas de Google abiertas, usa un perfil separado para los próximos intentos.'
            : 'Envío pendiente. Se reintentará al recuperar la conexión o abrir la app.', 'pending');
          break;
        }
      }
    } finally {
      busy = false;
      if (rerun) { rerun = false; void flush() }
    }
  }
  function record({ name, stage, state }) {
    if (!state?.result || !state.syncId) return;
    const done = read(DONE_KEY, []); if (Array.isArray(done) && done.includes(state.syncId)) return;
    const pending = read(QUEUE_KEY, []);
    const queue = Array.isArray(pending) ? pending : [];
    if (!queue.some(x => x.id === state.syncId)) {
      queue.push(makePayload({ name, stage, state }));
      if (!write(QUEUE_KEY, queue)) { status('El navegador no ha podido guardar el envío. Mantén esta página abierta y avisa a la profesora.', 'pending'); return }
    }
    status(ready() ? (queue.find(x => x.id === state.syncId)?.lastPostAt ? 'Comprobando la recepción…' : 'Enviando el resultado…') : 'Envío pendiente de configuración.', 'pending');
    void flush();
  }
  window.adaptiveSync = { newId: id, record, flush };
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void flush() });
  document.addEventListener('DOMContentLoaded', () => { void flush() });
  setInterval(() => { void flush() }, 60000);
})();
