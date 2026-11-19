# Itinerario adaptativo · proporcionalidad

App autónoma para Matemáticas de 2.º ESO, alineada con las sesiones 1–4 de la UD 04. Abre `index.html` o directamente `Etapa_1.html`.

## Etapas

1. Proporcionalidad directa: cuatro plantillas, mínimo 4 y máximo 9 ejercicios. Las cuatro deben aparecer antes del reto.
2. Proporcionalidad inversa: cuatro plantillas, mínimo 4 y máximo 9. Las cuatro deben aparecer antes del reto.
3. Proporcionalidad compuesta: cuatro plantillas, mínimo 4 y máximo 9. Las cuatro deben aparecer antes del reto.
4. Clasificar y resolver: cuatro plantillas por cada tipo (12 en total), mínimo 12 y máximo 24 ejercicios. Deben aparecer las 12 y se necesitan al menos dos respuestas completas correctas por tipo para conseguir la llave. En el reto se clasifica cada problema; se exigen tres clasificaciones correctas y al menos dos cálculos correctos.

Cada intento empieza con priors uniformes por etapa. La app actualiza por Bayes dos estimaciones locales en la última etapa: dominio de cálculo y dominio de clasificación. En todas las etapas usa tres niveles ordenados (`theta = [-2, 0, 2]`), `a_ef = 1.25`, suelo de azar según el formato y techo de acierto 0,95. Las respuestas con pista aportan menos evidencia. La llave depende de dominio alto local, entropía ≤ 0,75 bits, cobertura requerida y reto superado. No hay llave si falta alguna plantilla de práctica.

El progreso se guarda en `localStorage`, separado por nombre y etapa. Al terminar cada intento, los resultados y el detalle de ejercicios se envían a la pestaña `04Proporcionalidad` del libro privado **Informe adaptativo**, mediante el Apps Script común. Si no hay conexión, el envío queda en cola local para reintentarse. Escribe `estudiar` en la pantalla de inicio para practicar en cualquiera de las cuatro etapas sin enviar resultados. El acceso entre etapas para el resto del alumnado es una barrera didáctica local, no autenticación.

## Fuentes y mantenimiento

- `bank.js`: plantillas, parámetros, ejemplos, respuestas, dificultad, explicaciones y condiciones de las etapas.
- `app.js`: recorrido, selección adaptativa, actualización bayesiana, persistencia, promoción, modo desarrollador y acceso de práctica.
- `sync.js`: cola de envío a Apps Script; excluye el usuario `estudiar`.
- `app.css`, `font.js`, `template.html`: presentación y control de tamaño de letra.
- `build.py`: reconstruye `index.html` y los cuatro HTML autónomos.
- `verificar_banco.cjs`: verifica 300 variantes por plantilla con un oráculo independiente y condiciones de promoción.
- `simular_modelo.cjs`: simula 500 perfiles por nivel y etapa (en etapa 4 combina los tres niveles de cálculo con los tres de clasificación).

Ejecuta `python build.py`, `node verificar_banco.cjs` y `node simular_modelo.cjs` desde esta carpeta para reconstruir y comprobar la app. Las simulaciones miden coherencia con el modelo, no calibración psicométrica con respuestas reales.

