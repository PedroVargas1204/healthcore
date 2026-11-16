// Servidor de teste: entrega o app estático (out/) e imita a Supabase no mesmo endereço.
// /rest/v1 → PostgREST local (o mesmo esquema e as mesmas regras de RLS do banco real); /auth/v1 → respostas mínimas.
import { createServer, request } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const OUT = process.env.OUT ?? new URL("../../out", import.meta.url).pathname;
const PGRST = process.env.PGRST ?? "http://127.0.0.1:3010";
const PORTA = Number(process.env.PORTA ?? 3020);
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
let falharRede = false;

const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PATCH,DELETE,PUT,OPTIONS", "access-control-expose-headers": "*" };

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
  if (url.pathname === "/__teste/rede") {
    falharRede = url.searchParams.get("falhar") === "1";
    return res.writeHead(200, cors).end(String(falharRede));
  }
  if (url.pathname.startsWith("/rest/v1/")) {
    if (falharRede) return req.socket.destroy();
    const alvo = new URL(url.pathname.slice("/rest/v1".length) + url.search, PGRST);
    const h = { ...req.headers };
    delete h.host;
    const p = request(alvo, { method: req.method, headers: h }, (r) => {
      res.writeHead(r.statusCode ?? 500, { ...r.headers, ...cors });
      r.pipe(res);
    });
    p.on("error", () => res.writeHead(502, cors).end());
    return req.pipe(p);
  }
  if (url.pathname.startsWith("/auth/v1/")) {
    if (url.pathname.endsWith("/logout")) return res.writeHead(204, cors).end();
    return res.writeHead(400, { ...cors, "content-type": "application/json" }).end(JSON.stringify({ error: "nao_implementado" }));
  }
  let caminho = normalize(decodeURIComponent(url.pathname));
  let arq = join(OUT, caminho);
  if (existsSync(arq) && statSync(arq).isDirectory()) arq = join(arq, "index.html");
  if (!existsSync(arq)) arq = join(OUT, "404.html");
  res.writeHead(arq.endsWith("404.html") && !caminho.endsWith("404.html") ? 404 : 200, { "content-type": TIPOS[extname(arq)] ?? "application/octet-stream", "cache-control": "no-cache" });
  createReadStream(arq).pipe(res);
}).listen(PORTA, () => console.log(`teste em http://localhost:${PORTA}`));
