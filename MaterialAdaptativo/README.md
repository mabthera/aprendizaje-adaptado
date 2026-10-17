# MaterialAdaptativo

Aplicación de cinco etapas para practicar fracciones. Se inicia en `index.html` y avanza por las etapas desde la pantalla de resultados.

## Registro de intentos

Al terminar cada intento, la aplicación guarda en el navegador un resumen con el nombre escrito por el alumno, la etapa, el número de intento y los resultados. Lo envía al Apps Script vinculado a la hoja privada **Informe adaptativo**. Si falla la conexión, vuelve a intentarlo al abrir la app, recuperar la conexión, volver a la pestaña y periódicamente. Cada intento tiene un identificador único; Apps Script comprueba ese identificador antes de añadir una fila.

El alumnado no necesita iniciar sesión. El nombre escrito en la app no verifica su identidad. La hoja y las respuestas individuales no forman parte de este repositorio público.

## Archivos

- `Etapa_1_*.html` a `Etapa_5_*.html`: las cinco etapas.
- `sync.js`: cola local y envío del resumen.

El código de Apps Script se mantiene en Google y no se publica en este repositorio.
