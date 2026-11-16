// Gera o token de teste (assinado com o segredo do PostgREST local) e a sessão que o supabase-js guarda.
import { createHmac } from "node:crypto";
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
export function token(uid, email) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = { sub: uid, role: "authenticated", aud: "authenticated", email, iat: agora, exp: agora + 86400 * 30 };
  const cab = b64({ alg: "HS256", typ: "JWT" });
  const dados = b64(corpo);
  const ass = createHmac("sha256", "segredo-de-teste-local-com-mais-de-32-caracteres").update(`${cab}.${dados}`).digest("base64url");
  return `${cab}.${dados}.${ass}`;
}
export function sessao(uid, email, nome) {
  const t = token(uid, email);
  return {
    access_token: t,
    token_type: "bearer",
    expires_in: 86400 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 30,
    refresh_token: "teste",
    user: { id: uid, aud: "authenticated", role: "authenticated", email, user_metadata: { full_name: nome }, app_metadata: { provider: "google" } },
  };
}
if (process.argv[2]) console.log(JSON.stringify(sessao(process.argv[2], process.argv[3] ?? "pedro@teste.local", process.argv[4] ?? "Pedro Vargas")));
