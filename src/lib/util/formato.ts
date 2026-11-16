// Números no formato brasileiro, como o app antigo mostrava.

export const fmt = (n: number | null | undefined, casas = 1) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("pt-BR", { maximumFractionDigits: casas }) : "—";

/** Carga sem separador de milhar: "52,5", "120". Vazio quando não há número. */
export const fmtKg = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false }) : "";

/** Lê "52,5" ou "52.5". Texto vazio vira NaN. */
export const lerNumero = (v: unknown) => {
  if (v === null || v === undefined || v === "") return NaN;
  return parseFloat(String(v).replace(",", "."));
};

/** 84 → "1:24"; 3725 → "1:02:05" */
export const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const r = t % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : String(m)) + ":" + String(r).padStart(2, "0");
};

/** "2:45" → 165; "1:02:05" → 3725; "3" → 180 (minutos). */
export const lerMmss = (t: string) => {
  const p = String(t || "").trim().split(":").map(Number);
  if (p.some((x) => !Number.isFinite(x))) return NaN;
  if (p.length === 3) return (p[0] ?? 0) * 3600 + (p[1] ?? 0) * 60 + (p[2] ?? 0);
  if (p.length === 2) return (p[0] ?? 0) * 60 + (p[1] ?? 0);
  return (p[0] ?? 0) * 60;
};

/** 7.5 → "7 h 30" */
export const horasTxt = (h: number | null | undefined) => {
  if (typeof h !== "number" || !Number.isFinite(h)) return "—";
  const t = Math.round(h * 60);
  const m = t % 60;
  return `${Math.floor(t / 60)} h${m ? " " + String(m).padStart(2, "0") : ""}`;
};

/** 54 → "54 min"; 75 → "1 h 15" */
export const minTxt = (min: number | null | undefined) => {
  if (typeof min !== "number" || !Number.isFinite(min)) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
};

/** "12-15" → "12 a 15"; "falha" fica igual. */
export const repsTxt = (r: string) => String(r).replace(/^(\d+)\s*[-–]\s*(\d+)$/, "$1 a $2");

/** Unidade da meta: "40 s" → s, "500 m" → m, resto → reps. */
export const unidadeReps = (r: string): "s" | "m" | "reps" => {
  const t = String(r).trim();
  if (/\bs$/.test(t)) return "s";
  if (/\bm$/.test(t)) return "m";
  return "reps";
};

export const plural = (n: number, um: string, varios: string) => `${fmt(n, 1)} ${n === 1 ? um : varios}`;

export const soma = (a: number[]) => a.reduce((s, x) => s + x, 0);
export const media = (a: number[]) => (a.length ? soma(a) / a.length : null);
