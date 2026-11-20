/* Motor adaptativo común. build.py lo inserta en cada etapa para uso local autónomo. */
(function () {
  'use strict';
  const bank = globalThis.ProportionBank;
  const stage = typeof document === 'undefined' ? 1 : Number(document.documentElement.dataset.stage);
  const cfg = bank.STAGES[stage];
  const templates = bank.templatesFor(stage);
  const theta = [-2, 0, 2];
  const levels = ['Aún no domina', 'Dominio parcial', 'Dominio alto'];
  const keyNames = ['roja', 'azul', 'verde', 'ámbar'];
  const rootKey = 'ud4-proporcionalidad-adaptativo-v1';
  const keySvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9 2 2-2 2 1.5 1.5-2.5 2.5-1.5-1.5L14 13"/><path d="M6 16h3"/></svg>';
  const $ = id => document.getElementById(id);
  const storageKey = name => `${rootKey}:etapa${stage}:${normalize(name)}`;
  const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
  const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  function compoundFeedback(q) {
    const p = q.params;
    if (!p || q.family !== 'compuesta') return null;
    let rows, product;
    if (p.kind === 1) {
      rows = [
        ['Personas', 'Directa · más personas → más piezas', `× ${p.people * p.kp} personas nuevas ÷ ${p.people} iniciales`],
        ['Horas', 'Directa · más horas → más piezas', `× ${p.hours * p.kh} horas nuevas ÷ ${p.hours} iniciales`]
      ];
      product = `${p.units} × ${p.people * p.kp} × ${p.hours * p.kh} ÷ ${p.people} ÷ ${p.hours} = ${q.answer} piezas`;
    } else if (p.kind === 2) {
      rows = [
        ['Cajas (trabajo)', 'Directa · más cajas → más días', `× ${p.newWork} cajas nuevas ÷ ${p.oldWork} iniciales`],
        ['Personas', 'Inversa · más personas → menos días', `× ${p.people} personas iniciales ÷ ${p.people * p.kp} nuevas`]
      ];
      product = `${p.days} × ${p.newWork} × ${p.people} ÷ ${p.oldWork} ÷ ${p.people * p.kp} = ${q.answer} días`;
    } else if (p.kind === 3) {
      rows = [
        ['Máquinas', 'Directa · más máquinas → más consumo', `× ${p.machines * p.k1} máquinas nuevas ÷ ${p.machines} iniciales`],
        ['Horas', 'Directa · más horas → más consumo', `× ${p.hours * p.k2} horas nuevas ÷ ${p.hours} iniciales`]
      ];
      product = `${p.litres} × ${p.machines * p.k1} × ${p.hours * p.k2} ÷ ${p.machines} ÷ ${p.hours} = ${q.answer} L`;
    } else {
      rows = [
        ['Personas', 'Inversa · más personas → menos días', `× ${p.workers} personas iniciales ÷ ${p.newWorkers} nuevas`],
        ['Horas al día', 'Inversa · más horas → menos días', `× ${p.daily} horas iniciales ÷ ${p.newDaily} nuevas`]
      ];
      product = `${p.days} × ${p.workers} × ${p.daily} ÷ ${p.newWorkers} ÷ ${p.newDaily} = ${q.answer} días`;
    }
    return { rows, product };
  }
  function makeCompoundTable(q) {
    const data = compoundFeedback(q);
    if (!data) return null;
    const section = document.createElement('section'); section.className = 'compound-feedback';
    const heading = document.createElement('h3'); heading.textContent = 'Relaciones con la incógnita'; section.append(heading);
    const table = document.createElement('table'); table.className = 'compound-feedback-table';
    const thead = table.createTHead(), header = thead.insertRow();
    ['Magnitud que cambia', 'Tipo de relación', 'Operación y datos'].forEach(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; header.append(th); });
    const tbody = table.createTBody();
    data.rows.forEach(row => {
      const tr = tbody.insertRow();
      row.forEach((value, index) => { const td = tr.insertCell(); td.dataset.label = ['Magnitud que cambia', 'Tipo de relación', 'Operación y datos'][index]; td.textContent = value; });
    });
    const product = document.createElement('p'); product.className = 'compound-product';
    const label = document.createElement('strong'); label.textContent = 'Producto completo (5 datos): ';
    product.append(label, document.createTextNode(data.product));
    section.append(table, product);
    return section;
  }
  const isStudyUser = name => normalize(name) === 'estudiar';
  const canEnterStage = (number, name, previousKey, transferredKey, visitedStage) => number === 1 || (isStudyUser(name) && !!cleanName(name)) || (!!cleanName(name) && !!(previousKey || transferredKey || visitedStage));
  const getJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const setJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const entropy = p => -p.reduce((sum, x) => sum + (x > 0 ? x * Math.log2(x) : 0), 0);
  const fixed = (x, digits = 3) => Number(x).toFixed(digits);
  let learner = '', state = null, developerOpen = false, fullscreenStarting = false;

  const theory = {
    1: [
      ['Detectar una relación directa','Comprueba si el cociente entre las dos magnitudes permanece constante. Al duplicar una, se duplica la otra.','3 personas necesitan 450 g. Para 5: 450 × 5 ÷ 3 = 750 g.','La relación directa se refiere a magnitudes que varían en el mismo sentido.'],
      ['Usar el valor unitario','Calcula cuánto corresponde a una unidad y multiplica por la cantidad buscada.','4 cuadernos cuestan 6 €. Uno cuesta 1,50 €; 7 cuestan 10,50 €.','Conserva las unidades y comprueba si el resultado crece con la cantidad.'],
      ['Comprobar el resultado','Sustituye el dato hallado y verifica la razón o el factor de escala.','Si 8 m cuestan 28 €, 11 m cuestan 38,50 € porque 28 ÷ 8 = 38,50 ÷ 11.','No sumes la misma diferencia: conserva la razón.']
    ],
    2: [
      ['Detectar una relación inversa','Si una tarea o distancia es fija, más trabajadores o más velocidad implican menos tiempo.','6 personas tardan 10 días; 12 personas tardan 6 × 10 ÷ 12 = 5 días.','Antes de calcular, señala qué permanece fijo.'],
      ['Conservar el producto','Multiplica los valores conocidos de las magnitudes inversas y divide por el nuevo valor.','A 60 km/h se tardan 4 h. A 80 km/h: 60 × 4 ÷ 80 = 3 h.','No uses una regla directa para cantidades que cambian en sentidos opuestos.'],
      ['Comprobar la respuesta','Multiplica trabajador por tiempo o velocidad por tiempo y compara los productos.','3 grifos tardan 8 h; 4 tardan 6 h: 3 × 8 = 4 × 6.','Si el producto no se conserva, revisa el planteamiento.']
    ],
    3: [
      ['Variar una magnitud cada vez','Compara cada magnitud nueva con la inicial y decide si afecta directa o inversamente a la incógnita.','4 personas durante 3 h hacen 120 piezas. Duplicar personas y horas multiplica la producción por 4.','No combines todos los datos sin decidir antes el sentido de cada relación.'],
      ['Combinar factores','Multiplica por los factores directos y divide por los inversos, manteniendo las unidades.','5 personas tardan 8 días; 10 personas hacen una tarea triple: 8 × 3 ÷ 2 = 12 días.','La tarea mayor aumenta el tiempo; más personas lo reducen.'],
      ['Comprobar con el rendimiento','Calcula la tasa por unidad de tiempo y verifica que reproduce el resultado.','6 trabajadores hacen 90 unidades en 5 h: 3 unidades por trabajador y hora.','Incluye todas las magnitudes que afectan al resultado.']
    ],
    4: [
      ['Primero clasificar','Elige directa si ambas magnitudes cambian en el mismo sentido, inversa si una aumenta y la otra disminuye para una cantidad fija, y compuesta si intervienen varias relaciones.','Más cuadernos al mismo precio por unidad: directa. Más velocidad en la misma distancia: inversa.','No decidas por una palabra aislada: identifica qué se mantiene fijo.'],
      ['Después calcular','Una vez elegido el modelo, usa razón constante, producto constante o combina factores directos e inversos.','8 trabajadores tardan 9 días; 12 tardan 8 × 9 ÷ 12 = 6 días.','La clasificación correcta y el cálculo correcto son evidencias distintas.'],
      ['Verificar sentido y unidades','Comprueba que la respuesta cambia en el sentido esperado y que incluye la unidad pedida.','Si aumentan personas y horas, la producción debe aumentar.','Un resultado numérico plausible también debe corresponder al modelo elegido.']
    ]
  };

  const pCorrect = (th, b, c) => Math.min(.95, c + (1 - c) / (1 + Math.exp(-1.25 / (1 - c) * (th - b))));
  const probs = q => theta.map(th => ({
    main: pCorrect(th, q.b, q.kind === 'choice' ? 1 / q.options.length : 0),
    step: q.step ? pCorrect(th, q.b - .2, 1 / q.step.options.length) : null
  }));
  function evidence(q, outcome, hint = false) {
    const ps = probs(q), strength = hint ? .55 : 1;
    return ps.map(x => {
      const m = outcome.main ? x.main : 1 - x.main;
      if (!q.step) return Math.pow(m, strength);
      const s = outcome.step ? x.step : 1 - x.step;
      return Math.pow(m, .5 * strength) * Math.pow(s, .5 * strength);
    });
  }
  function posterior(prior, factors) {
    const raw = prior.map((x, i) => x * factors[i]);
    const z = raw.reduce((a, b) => a + b, 0);
    return raw.map(x => x / z);
  }
  function information(q, prior, classificationPrior = prior) {
    const ps = probs(q), scenarios = q.step ? [[false, false], [false, true], [true, false], [true, true]] : [[false, true], [true, true]];
    const before = entropy(prior) + (q.step ? entropy(classificationPrior) : 0);
    let after = 0;
    for (const [main, stepResult] of scenarios) {
      const mainL = ps.map(x => main ? x.main : 1 - x.main), stepL = ps.map(x => stepResult ? x.step : 1 - x.step);
      const pMain = prior.reduce((sum, x, i) => sum + x * mainL[i], 0);
      const mainAfter = posterior(prior, mainL);
      if (!q.step) after += pMain * entropy(mainAfter);
      else {
        const pStep = classificationPrior.reduce((sum, x, i) => sum + x * stepL[i], 0);
        after += pMain * pStep * (entropy(mainAfter) + entropy(posterior(classificationPrior, stepL)));
      }
    }
    return Math.max(0, before - after);
  }
  const freshState = (attempt = 1, key = false, recent = []) => ({
    attempt, key, phase: 'theory', posterior: [1 / 3, 1 / 3, 1 / 3], classificationPosterior: [1 / 3, 1 / 3, 1 / 3], history: [], exitItems: [], exitAnswers: [],
    current: null, answered: false, hint: false, recent, stats: {}, selection: null, previousUpdate: null, result: null,
    syncId: null
  });
  function save() { if (learner && state) setJson(storageKey(learner), state); }
  function sample(t, used, rng = Math.random) {
    let item;
    for (let i = 0; i < 120; i++) { item = t.make(rng); if (!used.has(item.signature)) return item; }
    return item;
  }
  function usedSignatures() { return new Set([...state.recent, ...state.history.map(x => x.q.signature), ...state.exitItems.map(x => x.signature)]); }
  function selectQuestionForStage(stageCfg, stageTemplates, selectionState, rng = Math.random) {
    const history = selectionState.history || [];
    const counts = new Map();
    for (const item of history) counts.set(item.q.id, (counts.get(item.q.id) || 0) + 1);
    const missingEssential = (stageCfg.essential || []).filter(id => !counts.has(id));
    const seenFamilies = new Set(history.map(item => item.q.family));
    const missingFamilies = stageCfg.families.filter(family => !seenFamilies.has(family));
    let candidates = missingEssential.length ? stageTemplates.filter(t => missingEssential.includes(t.id)) : missingFamilies.length ? stageTemplates.filter(t => missingFamilies.includes(t.family)) : stageTemplates;
    if (history.length < stageCfg.min) {
      const unseen = candidates.filter(t => !counts.has(t.id));
      if (unseen.length) candidates = unseen;
    }
    const maxPerType = Math.ceil(stageCfg.max / stageTemplates.length);
    const underCap = candidates.filter(t => (counts.get(t.id) || 0) < maxPerType);
    if (underCap.length) candidates = underCap;
    const recentTypes = new Set(history.slice(-3).map(item => item.q.id));
    const spaced = candidates.filter(t => !recentTypes.has(t.id));
    if (spaced.length) candidates = spaced;
    const used = new Set([...(selectionState.recent || []), ...history.map(item => item.q.signature), ...(selectionState.exitItems || []).map(q => q.signature)]);
    const pool = candidates.map(t => sample(t, used, rng));
    const info = pool.map(q => information(q, selectionState.posterior, selectionState.classificationPosterior));
    const maxIG = Math.max(...info, 1e-9), estimate = selectionState.posterior.reduce((sum, p, i) => sum + p * theta[i], 0);
    const rows = pool.map((q, i) => {
      const typeHistory = history.filter(item => item.q.id === q.id);
      const familyStats = selectionState.stats[q.family] || { asked: 0, wrong: 0 };
      const typeWeakness = typeHistory.length ? typeHistory.filter(item => !item.full).length / typeHistory.length : .5;
      const familyWeakness = familyStats.asked ? familyStats.wrong / familyStats.asked : .5;
      const weakness = .7 * typeWeakness + .3 * familyWeakness;
      const fit = Math.max(0, 1 - Math.abs(q.b - estimate) / 2);
      const count = counts.get(q.id) || 0;
      return { q, ig: info[i], utility: .60 * info[i] / maxIG + .20 * fit + .12 * weakness + (count === 0 ? .08 : 0) - .10 * count + rng() * .015 };
    }).sort((a, b) => b.utility - a.utility);
    const selection = { chosen: rows[0].q.id, rows: rows.map(x => ({ id: x.q.id, family: x.q.family, ig: x.ig, utility: x.utility, preview: x.q.text.replace(/<sup>/g, '^').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() })) };
    return { q: rows[0].q, selection };
  }
  function chooseQuestion() {
    const chosen = selectQuestionForStage(cfg, templates, state);
    state.selection = chosen.selection;
    return chosen.q;
  }
  function renderJourney() {
    const list = $('journey'); list.replaceChildren();
    for (let i = 1; i <= 4; i++) {
      const li = document.createElement('li'), earned = !!learner && (i < stage || (i === stage && state?.key));
      li.className = `journey-stage ${i === stage ? 'active' : ''} ${earned ? 'earned' : ''}`;
      li.style.setProperty('--key-color', bank.STAGES[i].color);
      if (isStudyUser(learner)) {
        const link = document.createElement('a');
        link.className = 'journey-link';
        link.href = `Etapa_${i}.html?alumno=${encodeURIComponent(learner)}`;
        link.setAttribute('aria-label', `Practicar ${bank.STAGES[i].short}`);
        link.innerHTML = `<span class="stage-dot" aria-hidden="true">${i}</span><span>${bank.STAGES[i].short}</span>`;
        li.append(link);
      } else {
        li.innerHTML = `<span class="stage-dot" aria-hidden="true">${earned ? keySvg : i}</span><span>${bank.STAGES[i].short}</span>`;
        li.setAttribute('aria-label', `${bank.STAGES[i].short}: ${earned ? 'llave conseguida' : i === stage ? 'etapa actual' : 'pendiente'}`);
      }
      list.append(li);
    }
  }
  function show(which) {
    for (const id of ['welcome', 'theory', 'practice', 'exit', 'result']) $(`view-${id}`).hidden = id !== which;
    $('app').dataset.phase = which;
    window.scrollTo(0, 0);
    renderDeveloper();
  }
  function renderTheory() {
    state.phase = 'theory'; state.current = null; state.answered = false; state.hint = false;
    renderJourney(); show('theory');
    $('stage-title').textContent = `Etapa ${stage} · ${cfg.title}`;
    $('learner-label').textContent = learner;
    const area = $('theory-sections'); area.replaceChildren();
    theory[stage].forEach(([title, body, example, warning], i) => {
      const details = document.createElement('details'); details.className = 'theory-section';
      details.innerHTML = `<summary><span class="theory-number">0${i + 1}</span>${title}</summary><div class="theory-body"><p>${body}</p><p class="worked"><strong>Ejemplo</strong><br>${example}</p><p class="warning"><strong>Atención:</strong> ${warning}</p></div>`;
      area.append(details);
    });
    save();
  }
  function renderQuestion(q, final = false) {
    const area = final ? $('exit-question') : $('question');
    area.innerHTML = q.text;
    const stepWrap = final ? $('exit-step-wrap') : $('step-wrap');
    const stepSelect = final ? $('exit-step') : $('step');
    stepWrap.hidden = !q.step;
    if (q.step) {
      (final ? $('exit-step-label') : $('step-label')).textContent = q.step.prompt;
      stepSelect.replaceChildren(new Option('Elige una opción', ''));
      for (const option of q.step.options) stepSelect.add(new Option(option, option));
    }
    const answer = final ? $('exit-answer') : $('answer');
    const select = final ? $('exit-select') : $('answer-select');
    const label = final ? $('exit-answer-label') : $('answer-label');
    const isChoice = q.kind === 'choice';
    answer.hidden = isChoice; select.hidden = !isChoice;
    label.htmlFor = isChoice ? select.id : answer.id;
    label.textContent = isChoice ? 'Elige tu respuesta' : 'Tu respuesta (puedes usar coma decimal; no hace falta escribir la unidad)';
    answer.placeholder = q.kind === 'pair' ? 'Ej.: -5;4' : q.kind === 'sequence' ? 'Ej.: 8;4;2;1;1/2' : '';
    answer.value = ''; select.replaceChildren(new Option('Elige una opción', ''));
    if (isChoice) for (const option of q.options) select.add(new Option(option, option));
    (final ? $('exit-error') : $('answer-error')).textContent = '';
    if (!isChoice) answer.focus(); else select.focus();
  }
  function renderPractice() {
    state.phase = 'practice'; if (!state.current) state.current = chooseQuestion();
    show('practice'); $('question-count').textContent = `Ejercicio ${state.history.length + 1}`;
    renderCircuit();
    renderQuestion(state.current);
    $('hint-text').hidden = !state.hint; $('hint-text').textContent = state.hint ? state.current.hint : '';
    $('hint-button').disabled = state.hint;
    $('feedback').hidden = true; $('next-button').hidden = true; $('check-button').hidden = false;
    save();
  }
  const numericValue = text => {
    const raw = String(text).trim().replace(/−/g, '-').replace(/\s/g, '').replace(',', '.');
    if (/^[+-]?\d+\/[-+]?\d+$/.test(raw)) { const [a, b] = raw.split('/').map(Number); return b ? a / b : NaN; }
    return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(raw) ? Number(raw) : NaN;
  };
  function sameAnswer(q, input) {
    const entered = String(input).trim(); if (!entered) return false;
    if (q.kind === 'rat' || q.kind === 'int') {
      const actual = numericValue(entered), expected = numericValue(q.answer);
      return Number.isFinite(actual) && (q.kind !== 'int' || Number.isInteger(actual)) && Math.abs(actual - expected) < 1e-10;
    }
    if (q.kind === 'pair' || q.kind === 'sequence') {
      const a = entered.split(';'), b = q.answer.split(q.answer.includes(';') ? ';' : ',');
      return a.length === b.length && a.every((v, i) => Number.isFinite(numericValue(v)) && Math.abs(numericValue(v) - numericValue(b[i])) < 1e-10);
    }
    if (q.kind === 'power') {
      const compact = entered.replace(/\s/g, '').replace(/⁻/g, '-');
      const match = compact.match(/^\(?([+-]?\d+)\)?\^\(?([+-]?\d+)\)?$/);
      if (!match) return false;
      const target = q.answer.match(/^([+-]?\d+)\^([+-]?\d+)$/);
      if (q.acceptEquivalentPower) {
        const base = Number(match[1]), exponent = Number(match[2]);
        return Number.isSafeInteger(base) && Number.isSafeInteger(exponent) && base >= 2 && base <= 1000000 && exponent >= 1 && exponent <= 30 && BigInt(base) ** BigInt(exponent) === BigInt(target[1]) ** BigInt(target[2]);
      }
      return Number(match[1]) === Number(target[1]) && Number(match[2]) === Number(target[2]);
    }
    if (q.kind === 'product') {
      const parts = entered.replace(/×|·/g, '*').split('*').map(x => x.trim());
      const expected = q.answer.split('*');
      return parts.length === expected.length && parts.every((x, i) => /^\(?-?\d+\)?$/.test(x) && Number(x.replace(/[()]/g, '')) === Number(expected[i]));
    }
    return normalize(entered) === normalize(q.answer);
  }
  const enteredFor = final => {
    const q = final ? state.exitItems[state.exitAnswers.length] : state.current;
    return (q.kind === 'choice' ? $(final ? 'exit-select' : 'answer-select') : $(final ? 'exit-answer' : 'answer')).value;
  };
  function update(q, main, step, hint) {
    const prior = [...state.posterior], typePrior = [...state.classificationPosterior], before = entropy(prior), typeBefore = entropy(typePrior), ps = probs(q), strength = hint ? .55 : 1;
    const factors = ps.map(x => Math.pow(main ? x.main : 1 - x.main, strength));
    state.posterior = posterior(prior, factors);
    const typeFactors = q.step ? ps.map(x => Math.pow(step ? x.step : 1 - x.step, strength)) : [1,1,1];
    if (q.step) state.classificationPosterior = posterior(typePrior, typeFactors);
    state.previousUpdate = { id:q.id, prior, typePrior, likelihoods:ps, factors, typeFactors, after:[...state.posterior], typeAfter:[...state.classificationPosterior], entropyBefore:before, entropyAfter:entropy(state.posterior), typeEntropyBefore:typeBefore, typeEntropyAfter:entropy(state.classificationPosterior), main, step, hint };
  }
  function record(q, entered, main, step, hint, final, selectedStep = '') {
    update(q, main, step, hint);
    const full = main && step && !hint;
    const item = { q, entered, main, step, selectedStep, hint, full, correctType:!q.step || step, correctCalculation:main, phase: final ? 'exit' : 'practice' };
    (final ? state.exitAnswers : state.history).push(item);
    const stats = state.stats[q.family] || { asked: 0, full: 0, wrong: 0, hinted: 0 };
    stats.asked++; if (full) stats.full++; if (!main || !step) stats.wrong++; if (hint) stats.hinted++;
    state.stats[q.family] = stats;
    state.recent.push(q.signature); state.recent = state.recent.slice(-300);
    save(); return item;
  }
  function answerPractice() {
    const q = state.current, entered = enteredFor(false), stepValue = q.step ? $('step').value : '';
    if (!String(entered).trim() || (q.step && !stepValue)) { $('answer-error').textContent = 'Completa la respuesta y la elección solicitada.'; return; }
    const beforeTypes = essentialTypesSeen(), beforeCount = state.history.length;
    const item = record(q, entered, sameAnswer(q, entered), !q.step || stepValue === q.step.answer, state.hint, false, stepValue);
    const milestones = [];
    if (essentialTypesSeen() > beforeTypes) milestones.push(`Nuevo tipo explorado: ${bank.LABELS[q.id]}.`);
    if (beforeCount < cfg.min && state.history.length >= cfg.min) milestones.push('Práctica mínima completada.');
    if (readyForExit()) milestones.push('Reto de la llave preparado.');
    renderCircuit(milestones.join(' '));
    if (milestones.length) pulseCircuit();
    $('feedback').hidden = false;
    $('feedback').className = `feedback ${item.full ? 'good' : 'review'}`;
    const feedbackTitle = item.full ? 'Clasificación y cálculo correctos.' : q.step && !item.step && !item.main ? 'Revisa la clasificación y el cálculo.' : q.step && !item.step ? 'El resultado puede ser correcto; revisa el tipo elegido.' : q.step && !item.main ? 'El tipo está bien elegido; revisa el cálculo.' : 'Revisa el resultado.';
    const feedback = $('feedback'); feedback.replaceChildren();
    const title = document.createElement('strong'); title.textContent = feedbackTitle; feedback.append(title);
    const compoundTable = makeCompoundTable(q);
    if (compoundTable) feedback.append(compoundTable);
    else { const explanation = document.createElement('p'); explanation.innerHTML = `<b>Explicación:</b> ${escapeHtml(q.explanation)}`; feedback.append(explanation); }
    const expected = document.createElement('p'); expected.innerHTML = `Respuesta esperada: <b>${escapeHtml(q.answer)}</b>${q.step ? ` · Tipo correcto: <b>${escapeHtml(q.step.answer)}</b>` : ''}.`; feedback.append(expected);
    $('check-button').hidden = true; $('next-button').hidden = false; $('hint-button').disabled = true;
    $('answer').disabled = true; $('answer-select').disabled = true; $('step').disabled = true;
    renderDeveloper(); $('feedback').scrollIntoView({ block: 'nearest' }); $('next-button').focus({ preventScroll: true });
  }
  const covered = () => cfg.families.every(f => state.history.some(x => x.q.family === f));
  const essentialTypesSeen = () => cfg.essential.filter(id => state.history.some(x => x.q.id === id)).length;
  function readyForExit() {
    const n = state.history.length, p = state.posterior;
    const allTemplatesSeen = cfg.essential.every(id => state.history.some(x => x.q.id === id));
    const mixedReady = !cfg.mixed || (state.classificationPosterior[2] >= .80 && state.classificationPosterior[2] === Math.max(...state.classificationPosterior) && cfg.families.every(type => state.history.some(x => x.q.family === type && x.full)));
    return allTemplatesSeen && n >= cfg.min && (
      (n >= cfg.early && p[2] >= .90 && entropy(p) <= .75) ||
      (n >= cfg.min && p[2] >= .80 && p[2] === Math.max(...p))
    ) && mixedReady;
  }
  function renderCircuit(message = '') {
    const seen = essentialTypesSeen(), total = cfg.essential.length, n = state.history.length;
    const ready = readyForExit();
    const amount = ready ? 80 : Math.round(35 * seen / total + 35 * Math.min(n / cfg.min, 1));
    $('circuit-stage').textContent = `Llave ${keyNames[stage - 1]}`;
    $('circuit-types').textContent = `Tipos explorados ${seen}/${total}`;
    $('circuit-count').textContent = `Práctica ${n}/${cfg.min} · hasta ${cfg.max}`;
    $('circuit-fill').style.width = `${amount}%`;
    $('circuit-node-types').classList.toggle('active', seen === total);
    $('circuit-node-practice').classList.toggle('active', n >= cfg.min || ready);
    $('circuit-node-ready').classList.toggle('active', ready);
    $('circuit-track').setAttribute('aria-valuenow', String(amount));
    $('circuit-track').setAttribute('aria-valuetext', `${seen} de ${total} tipos clave explorados; ${n} ejercicios de práctica completados; ${ready ? 'reto disponible' : 'reto pendiente'}`);
    $('circuit-status').textContent = message || (ready ? 'Reto de la llave preparado.' : n >= cfg.min ? 'Ajustando el siguiente desafío.' : 'La siguiente pregunta se adapta a tus respuestas.');
  }
  function pulseCircuit() {
    const circuit = $('practice-circuit');
    circuit.classList.remove('pulse');
    requestAnimationFrame(() => {
      circuit.classList.add('pulse');
      setTimeout(() => circuit.classList.remove('pulse'), 300);
    });
  }
  function nextPractice() {
    $('answer').disabled = false; $('answer-select').disabled = false; $('step').disabled = false;
    const n = state.history.length, p = state.posterior;
    const allTemplatesSeen = cfg.essential.every(id => state.history.some(x => x.q.id === id));
    const mixedPracticeReady = !cfg.mixed || (state.classificationPosterior[2] >= .80 && state.classificationPosterior[2] === Math.max(...state.classificationPosterior) && cfg.families.every(type => state.history.some(x => x.q.family === type && x.full)));
    const bothDomainsHigh = mixedPracticeReady;
    if (allTemplatesSeen && n >= cfg.min && p[2] >= .80 && p[2] === Math.max(...p) && bothDomainsHigh) { beginExit(); return; }
    if (n >= cfg.max) { finish('max'); return; }
    state.current = chooseQuestion(); state.hint = false; renderPractice();
  }
  function beginExit() {
    state.phase = 'exit'; state.current = null; state.exitItems = [];
    for (const id of cfg.exit) state.exitItems.push(sample(templates.find(t => t.id === id), usedSignatures()));
    state.exitAnswers = []; renderExit(); save();
  }
  function renderExit() {
    state.phase = 'exit'; show('exit');
    const i = state.exitAnswers.length;
    if (i >= state.exitItems.length) { finish('exit'); return; }
    $('exit-count').textContent = `Comprobación ${i + 1} de ${cfg.exit.length}`;
    const circuitAmount = Math.round(80 + 20 * i / cfg.exit.length);
    $('exit-circuit-stage').textContent = `Llave ${keyNames[stage - 1]}`;
    $('exit-circuit-fill').style.width = `${circuitAmount}%`;
    $('exit-circuit-track').setAttribute('aria-valuenow', String(circuitAmount));
    $('exit-circuit-track').setAttribute('aria-valuetext', `${i} de ${cfg.exit.length} respuestas guardadas; corrección al terminar`);
    $('exit-saved').textContent = `${i} de ${cfg.exit.length} respuestas guardadas`;
    renderQuestion(state.exitItems[i], true); save();
  }
  function answerExit() {
    const q = state.exitItems[state.exitAnswers.length], entered = enteredFor(true), stepValue = q.step ? $('exit-step').value : '';
    if (!String(entered).trim() || (q.step && !stepValue)) { $('exit-error').textContent = 'Completa la respuesta y la elección solicitada.'; return; }
    record(q, entered, sameAnswer(q, entered), !q.step || stepValue === q.step.answer, false, true, stepValue);
    renderDeveloper();
    if (state.exitAnswers.length >= cfg.exit.length) finish('exit'); else renderExit();
  }
  function handleQuestionEnter(event, final = false) {
    if (event.key !== 'Enter' || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const targets = final ? ['exit-answer', 'exit-select', 'exit-step', 'exit-check'] : ['answer', 'answer-select', 'step', 'check-button', 'next-button'];
    if (!targets.includes(event.target.id)) return;
    if (event.target.id === (final ? 'exit-step' : 'step') && String($(final ? 'exit-answer' : 'answer').value).trim() === '') {
      event.preventDefault();
      $(final ? 'exit-answer' : 'answer').focus();
      return;
    }
    event.preventDefault();
    if (event.repeat) return;
    const button = final ? $('exit-check') : $('next-button').hidden ? $('check-button') : $('next-button');
    if (!button.hidden && !button.disabled) button.click();
  }
  function promotionRequirements(stageCfg, practice, exit) {
    if (!stageCfg.essential.every(id => practice.some(x => x.q.id === id))) return false;
    const full = exit.filter(x => x.full);
    if (full.length < stageCfg.need) return false;
    if (stageCfg.required && !stageCfg.required.every(id => full.some(x => x.q.id === id))) return false;
    if (stageCfg.mixed) {
      const all = [...practice, ...exit];
      const byType = Object.fromEntries(stageCfg.families.map(type => [type, all.filter(x => x.q.family === type && x.full).length]));
      if (!stageCfg.families.every(type => byType[type] >= 2)) return false;
      if (exit.length !== 3 || exit.some(x => !x.step) || exit.filter(x => x.main).length < 2) return false;
    }
    return true;
  }
  function exitPassed() { return promotionRequirements(cfg, state.history, state.exitAnswers); }
  function finish(reason) {
    const pass = reason === 'exit' && exitPassed(), high = pass && state.posterior[2] >= .80 && entropy(state.posterior) <= .75 && (!cfg.mixed || (state.classificationPosterior[2] >= .80 && entropy(state.classificationPosterior) <= .75));
    state.phase = 'result'; state.current = null; state.key ||= high;
    const best = state.posterior.indexOf(Math.max(...state.posterior));
    state.result = { reason, high, pass, level: high ? 2 : best === 0 ? 0 : 1, provisional: reason === 'max' || (reason === 'exit' && !high) };
    state.syncId ||= globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.floor(Math.random() * 16);
      return (c === 'x' ? r : (r & 3) | 8).toString(16);
    });
    if (!isStudyUser(learner)) globalThis.ProportionSync?.record({ name: learner, stage, state });
    save(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    renderResult();
  }
  function renderResult() {
    state.phase = 'result'; renderJourney(); show('result');
    const r = state.result;
    $('result-title').textContent = r.high ? (stage === 4 ? '¡Itinerario completado!' : `¡Llave ${stage} conseguida!`) : 'Tu siguiente paso';
    $('result-message').textContent = r.high ? `Has demostrado dominio alto en ${cfg.title.toLowerCase()}.` : r.provisional ? 'Este intento no aportó evidencia suficiente o no superó la comprobación final. Revisa los ejercicios y vuelve a intentarlo.' : 'Ya dominas una parte de la etapa. Revisa los tipos que te han costado.';
    $('result-milestone').hidden = false;
    const mixSummary = cfg.mixed ? ` Clasificación correcta: ${[...state.history,...state.exitAnswers].filter(x=>x.step).length}; cálculo correcto: ${[...state.history,...state.exitAnswers].filter(x=>x.main).length}.` : '';
    $('result-milestone').textContent = `${r.high ? 'Circuito completado. ' : ''}En este intento exploraste ${essentialTypesSeen()} de ${cfg.essential.length} plantillas clave y completaste ${state.history.length} ejercicios de práctica.${mixSummary}`;
    $('result-level').textContent = levels[r.level];
    $('key-card').hidden = !state.key; $('key-card').style.setProperty('--key-color', cfg.color);
    $('key-card').classList.toggle('is-revealed', !!state.key);
    $('retry').hidden = !!state.key; $('next-stage').hidden = !state.key || stage === 4;
    if (stage < 4) $('next-stage').href = `Etapa_${stage + 1}.html`;
    $('diploma').hidden = !(stage === 4 && state.key); $('diploma-name').textContent = learner;
    const review = $('review-list'); review.replaceChildren();
    [...state.history, ...state.exitAnswers].forEach((x, i) => {
      const details = document.createElement('details'), summary = document.createElement('summary'), body = document.createElement('p'), explanation = document.createElement('p');
      summary.textContent = `${x.phase === 'exit' ? 'Comprobación' : 'Práctica'} ${i + 1}: ${x.full ? 'correcto' : 'revisar'}`;
      body.textContent = `${x.q.text.replace(/<[^>]+>/g, '')} ${x.q.step ? `Tipo elegido: ${x.selectedStep || '—'} (${x.step ? 'correcto' : 'revisar'}). ` : ''}Tu respuesta: ${x.entered} (${x.main ? 'cálculo correcto' : 'cálculo por revisar'}). Solución: ${x.q.answer}.${x.q.step ? ` Tipo correcto: ${x.q.step.answer}.` : ''}`;
      const compoundTable = makeCompoundTable(x.q);
      if (!compoundTable) {
        const why = x.q.explanation || `Respuesta: ${x.q.answer}.`;
        explanation.textContent = `Explicación: ${String(why).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '')}`;
        details.append(summary, body, explanation);
      } else details.append(summary, body, compoundTable);
      review.append(details);
    });
    save();
  }
  function renderDeveloper() {
    const allowed = normalize(learner) === 'admin', visible = allowed && developerOpen;
    $('developer-toggle').hidden = !allowed;
    $('developer-toggle').setAttribute('aria-pressed', String(visible));
    $('developer').hidden = !visible;
    $('app').classList.toggle('dev-open', visible);
    document.body.classList.toggle('dev-open', visible);
    if (!visible || !state) return;
    const p = state.posterior, h = entropy(p), uncertainty = 100 * h / Math.log2(3);
    const cp = state.classificationPosterior || [1/3,1/3,1/3], ch = entropy(cp), cu = 100 * ch / Math.log2(3);
    $('dev-entropy').innerHTML = `<div class="dev-metric-head"><span>Entropía · cálculo</span><strong>${fixed(h)} <small>bits</small></strong></div><div class="dev-entropy-track" role="img" aria-label="Incertidumbre de cálculo: ${fixed(uncertainty, 1)} % del máximo"><span style="width:${uncertainty}%"></span></div><small>Incertidumbre del cálculo: ${fixed(uncertainty, 1)} % del máximo</small>${cfg.mixed ? `<div class="dev-metric-head"><span>Entropía · clasificación</span><strong>${fixed(ch)} <small>bits</small></strong></div><div class="dev-entropy-track" role="img" aria-label="Incertidumbre de clasificación: ${fixed(cu, 1)} % del máximo"><span style="width:${cu}%"></span></div><small>Incertidumbre de clasificación: ${fixed(cu, 1)} % del máximo</small>` : ''}`;
    const cuts = [p[0] * 100, (p[0] + p[1]) * 100];
    const ring = `conic-gradient(#c34755 0 ${cuts[0]}%, #d49a32 ${cuts[0]}% ${cuts[1]}%, #16836b ${cuts[1]}% 100%)`;
    const classBars = cfg.mixed ? `<h3>Clasificación del tipo</h3>${cp.map((value,i)=>`<div class="dev-prob dev-level-${i}"><div><span>${levels[i]}</span><strong>${fixed(value*100,1)} %</strong></div><div class="dev-track"><span style="width:${value*100}%"></span></div></div>`).join('')}` : '';
    $('dev-probabilities').innerHTML = `<div class="dev-posterior"><div class="dev-ring" style="background:${ring}" role="img" aria-label="Probabilidades de cálculo: ${levels.map((label, i) => `${label} ${fixed(p[i] * 100, 1)} %`).join(', ')}"><div><span>Dominio de cálculo</span><strong>${fixed(p[2] * 100, 1)} %</strong></div></div><div class="dev-bars">${p.map((value, i) => `<div class="dev-prob dev-level-${i}"><div><span>${levels[i]}</span><strong>${fixed(value * 100, 1)} %</strong></div><div class="dev-track"><span style="width:${value * 100}%"></span></div></div>`).join('')}</div></div>${classBars}`;
    const rows = state.selection?.rows || [];
    const maxUtility = Math.max(...rows.map(x => x.utility), 0.001);
    $('dev-selection').innerHTML = rows.length ? rows.map((x, i) => `<div class="dev-candidate ${x.id === state.selection.chosen ? 'chosen' : ''}"><div class="dev-candidate-head"><span class="dev-rank">${i + 1}</span><strong>${escapeHtml(bank.LABELS[x.id] || 'Tipo de ejercicio')}</strong>${x.id === state.selection.chosen ? '<span class="dev-chosen">Elegida</span>' : ''}</div>${x.preview ? `<p class="dev-candidate-example">Ejemplo: ${escapeHtml(x.preview)}</p>` : ''}<div class="dev-candidate-track"><span style="width:${Math.max(0, 100 * x.utility / maxUtility)}%"></span></div><div class="dev-candidate-values"><span>Información <b>${fixed(x.ig)} bits</b></span><span>Puntuación <b>${fixed(x.utility)}</b></span></div></div>`).join('') : '<p class="dev-empty">La comprobación final usa preguntas fijadas.</p>';
    const u = state.previousUpdate;
    $('dev-update').innerHTML = u ? `<div class="dev-update-head"><strong>${escapeHtml(bank.LABELS[u.id] || 'Último ejercicio')}</strong><span class="${u.main && u.step ? 'dev-success' : 'dev-error'}">${u.main && u.step ? 'Acierto completo' : 'Componentes separados'}</span></div><p class="dev-entropy-change">Cálculo: entropía ${fixed(u.entropyBefore)} → ${fixed(u.entropyAfter)} bits</p>${u.prior.map((before, i) => `<div class="dev-update-row dev-level-${i}"><div class="dev-update-label"><span>${levels[i]}</span><strong>${fixed(before * 100, 1)} → ${fixed(u.after[i] * 100, 1)} %</strong></div><small>P(acierto de cálculo) ${fixed(u.likelihoods[i].main)} · evidencia ${fixed(u.factors[i])}</small></div>`).join('')}${cfg.mixed ? `<p class="dev-entropy-change">Clasificación: entropía ${fixed(u.typeEntropyBefore)} → ${fixed(u.typeEntropyAfter)} bits · ${u.step ? 'correcta' : 'incorrecta'}</p>${u.typePrior.map((before,i)=>`<div class="dev-update-row dev-level-${i}"><div class="dev-update-label"><span>${levels[i]}</span><strong>${fixed(before*100,1)} → ${fixed(u.typeAfter[i]*100,1)} %</strong></div><small>P(acierto de clasificación) ${fixed(u.likelihoods[i].step)} · evidencia ${fixed(u.typeFactors[i])}</small></div>`).join('')}` : ''}` : '<p class="dev-empty">Responde una pregunta para ver cómo cambian las probabilidades.</p>';
  }
  function resetAttempt(message) {
    if (!state || !['practice', 'exit'].includes(state.phase)) return;
    state = freshState(state.attempt, state.key, state.recent);
    renderTheory(); $('notice').textContent = `${message} El intento se ha reiniciado. Las llaves obtenidas se conservan.`; $('notice').hidden = false;
  }
  async function startAttempt() {
    if (fullscreenStarting) return;
    if (!document.documentElement.requestFullscreen) { showWindowedFallback('Este navegador no permite pantalla completa. Puedes reintentar en un navegador compatible o empezar en ventana.'); return; }
    fullscreenStarting = true;
    try {
      await document.documentElement.requestFullscreen();
      if (document.fullscreenElement !== document.documentElement) throw Error('No se activó pantalla completa');
      $('focus-dialog').hidden = true; state = freshState(state.attempt + 1, state.key, state.recent); state.focusMode = 'fullscreen';
      state.current = chooseQuestion(); renderPractice();
    } catch (error) { showWindowedFallback(`No se pudo activar la pantalla completa (${error?.name || 'permiso denegado'}). Puedes reintentar o empezar en ventana.`); }
    finally {
      fullscreenStarting = false;
      if (['practice', 'exit'].includes(state?.phase) && state.focusMode !== 'windowed' && document.fullscreenElement !== document.documentElement) {
        resetAttempt('Has salido de la pantalla completa.');
      }
    }
  }
  function showWindowedFallback(message) {
    $('focus-error').textContent = `${message} Si cambias de pestaña o la aplicación pierde el foco, se reiniciará el intento.`;
    $('focus-windowed').hidden = false;
    $('focus-windowed').focus();
  }
  function startWindowedAttempt() {
    $('focus-dialog').hidden = true;
    state = freshState(state.attempt + 1, state.key, state.recent);
    state.focusMode = 'windowed';
    state.current = chooseQuestion();
    renderPractice();
  }
  function setLearner(name) {
    learner = cleanName(name); if (!learner) return false;
    developerOpen = false; $('notice').hidden = true;
    try { localStorage.setItem(`${rootKey}:ultimo-alumno`, learner); } catch { }
    const saved = getJson(storageKey(learner), null);
    state = saved && Array.isArray(saved.posterior) && saved.posterior.length === 3 ? saved : freshState(0);
    if (['practice', 'exit'].includes(state.phase)) state = freshState(state.attempt, state.key, state.recent || []);
    if (state.key && state.result) renderResult(); else renderTheory();
    return true;
  }
  function init() {
    document.title = `Etapa ${stage} · ${cfg.title} · Proporcionalidad`;
    document.documentElement.style.setProperty('--stage-color', cfg.color);
    document.documentElement.style.setProperty('--key-color', cfg.color);
    $('hero-title').textContent = `Etapa ${stage} · ${cfg.title}`;
    $('hero-subtitle').textContent = `Itinerario adaptativo de proporcionalidad · ${stage} de 4`;
    $('focus-dialog').hidden = true;
    $('name-form').addEventListener('submit', e => { e.preventDefault(); if (!setLearner($('name').value)) $('name-error').textContent = 'Escribe tu nombre para continuar.'; });
    $('change-user').addEventListener('click', () => { if (document.fullscreenElement) return; learner = ''; developerOpen = false; $('name').value = ''; $('developer').hidden = true; $('developer-toggle').hidden = true; renderJourney(); show('welcome'); $('name').focus(); });
    $('start').addEventListener('click', () => { $('focus-error').textContent = ''; $('focus-windowed').hidden = true; $('focus-dialog').hidden = false; $('focus-start').focus(); });
    $('focus-cancel').addEventListener('click', () => { $('focus-dialog').hidden = true; $('start').focus(); });
    $('focus-start').addEventListener('click', startAttempt);
    $('focus-windowed').addEventListener('click', startWindowedAttempt);
    $('hint-button').addEventListener('click', () => { state.hint = true; $('hint-text').textContent = state.current.hint; $('hint-text').hidden = false; $('hint-button').disabled = true; save(); });
    $('check-button').addEventListener('click', answerPractice);
    $('next-button').addEventListener('click', nextPractice);
    $('exit-check').addEventListener('click', answerExit);
    $('view-practice').addEventListener('keydown', event => handleQuestionEnter(event));
    $('view-exit').addEventListener('keydown', event => handleQuestionEnter(event, true));
    $('retry').addEventListener('click', () => { state = freshState(state.attempt, state.key, state.recent); renderTheory(); });
    $('developer-toggle').addEventListener('click', () => { if (normalize(learner) !== 'admin') return; developerOpen = !developerOpen; renderDeveloper(); });
    document.addEventListener('fullscreenchange', () => { if (!fullscreenStarting && state?.focusMode !== 'windowed' && ['practice', 'exit'].includes(state?.phase) && document.fullscreenElement !== document.documentElement) resetAttempt('Has salido de la pantalla completa.'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetAttempt('Has cambiado de pantalla.'); });
    window.addEventListener('blur', () => { if (!fullscreenStarting) resetAttempt('La aplicación ha dejado de ser la ventana principal.'); });
    const transfer = new URLSearchParams(location.search), name = transfer.get('alumno') || getJson(`${rootKey}:ultimo-alumno`, '');
    const previousKey = getJson(`${rootKey}:etapa${stage - 1}:${normalize(name)}`, null)?.key;
    const transferredKey = transfer.get('llave') === `etapa${stage - 1}` && !!cleanName(transfer.get('alumno'));
    const visitedStage = !!getJson(storageKey(name), null);
    const authorized = canEnterStage(stage, name, previousKey, transferredKey, visitedStage);
    if (!authorized) { $('locked').hidden = false; $('locked-link').href = `Etapa_${stage - 1}.html`; $('view-welcome').hidden = true; return; }
    if (stage > 1 && name) setLearner(name); else { $('name').value = name || ''; renderJourney(); show('welcome'); }
  }
  if (typeof module !== 'undefined') module.exports = { entropy, pCorrect, probs, evidence, posterior, information, sameAnswer, canEnterStage, selectQuestionForStage, promotionRequirements };
  if (typeof document !== 'undefined') init();
})();

