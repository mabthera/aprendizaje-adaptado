"""Genera cuatro HTML autónomos desde las fuentes editables locales."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
template = (ROOT / "template.html").read_text(encoding="utf-8")
parts = {
    "__CSS__": (ROOT / "app.css").read_text(encoding="utf-8"),
    "__BANK__": (ROOT / "bank.js").read_text(encoding="utf-8"),
    "__FONT__": (ROOT / "font.js").read_text(encoding="utf-8"),
    "__SYNC__": (ROOT / "sync.js").read_text(encoding="utf-8"),
    "__APP__": (ROOT / "app.js").read_text(encoding="utf-8"),
}
for stage in range(1, 5):
    html = template.replace("__STAGE__", str(stage))
    for token, value in parts.items():
        html = html.replace(token, value.replace("</script>", "<\\/script>"))
    html += "\n</body>\n</html>\n"
    (ROOT / f"Etapa_{stage}.html").write_text(html, encoding="utf-8")

(ROOT / "index.html").write_text(
    '<!doctype html>\n<html lang="es"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<meta http-equiv="refresh" content="0; url=Etapa_1.html">'
    '<title>Proporcionalidad · Itinerario adaptativo</title></head>'
    '<body><p><a href="Etapa_1.html">Comenzar el itinerario</a></p></body></html>\n',
    encoding="utf-8",
)

