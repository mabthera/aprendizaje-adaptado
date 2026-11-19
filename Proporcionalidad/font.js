/* Dos controles de letra que conservan la preferencia entre etapas. */
(function () {
  'use strict';
  const key = 'ud4-proporcionalidad-tamano-letra-v1';
  const minimum = 80, maximum = 200, step = 10;
  const minus = document.getElementById('text-minus');
  const plus = document.getElementById('text-plus');
  const value = document.getElementById('text-size-value');
  let percent = 100;
  try {
    const stored = Number(localStorage.getItem(key));
    if (Number.isFinite(stored) && stored >= minimum && stored <= maximum) percent = Math.round(stored / step) * step;
  } catch { /* El control sigue funcionando sin almacenamiento. */ }

  function apply() {
    document.documentElement.style.setProperty('--student-font-size', `${16 * percent / 100}px`);
    document.body.classList.toggle('text-enlarged', percent > 100);
    value.textContent = `${percent} %`;
    minus.disabled = percent <= minimum;
    plus.disabled = percent >= maximum;
    try { localStorage.setItem(key, String(percent)); } catch { /* Preferencia solo en esta sesión. */ }
  }
  minus.addEventListener('click', () => { percent = Math.max(minimum, percent - step); apply(); });
  plus.addEventListener('click', () => { percent = Math.min(maximum, percent + step); apply(); });
  apply();
})();

