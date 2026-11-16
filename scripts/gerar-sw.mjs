// Depois do `next build`: gera out/sw.js com a lista de todos os arquivos do app,
// para o celular guardar tudo na primeira visita e abrir sem internet.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const arquivos = [];
const hash = createHash("sha256");

function andar(dir) {
  for (const nome of readdirSync(dir).sort()) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) andar(p);
    else {
      const rel = relative(OUT, p).split(sep).join("/");
      if (rel === "sw.js" || rel.startsWith("404") || rel.startsWith("_not-found")) continue;
      hash.update(rel).update(readFileSync(p));
      arquivos.push(rel.endsWith("index.html") ? "/" + rel.slice(0, -"index.html".length) : "/" + rel);
    }
  }
}
andar(OUT);
const versao = "hc-" + hash.digest("hex").slice(0, 12);

const sw = `// Gerado por scripts/gerar-sw.mjs. Não editar.
const VERSAO = ${JSON.stringify(versao)};
const ARQUIVOS = ${JSON.stringify(arquivos)};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("hc-") && k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "atualizar") self.skipWaiting();
});

// Arquivos do app: primeiro do celular, depois da rede. Dados (Supabase) não passam por aqui.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSAO).then(async (c) => {
      const guardado = await c.match(req, { ignoreSearch: true });
      if (guardado) return guardado;
      try {
        const r = await fetch(req);
        if (r.ok && url.pathname.startsWith("/_next/")) c.put(req, r.clone());
        return r;
      } catch (erro) {
        if (req.mode === "navigate") return (await c.match("/")) || Response.error();
        throw erro;
      }
    }),
  );
});
`;
writeFileSync(join(OUT, "sw.js"), sw);
console.log(`sw.js: ${arquivos.length} arquivos, versão ${versao}`);
