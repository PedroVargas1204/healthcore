import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { converter, converterNovo, lerBackup, lerQualquerBackup, migrarEstado, resumoBackup, uuidv5 } from "@/lib/dominio/conversor";

const exigir = createRequire(import.meta.url);
const referencia = exigir("../dados/conversor-referencia.cjs") as { converter: (b: unknown, uid: string) => Record<string, unknown>; uuidv5: (n: string) => string };
const UID = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const real = readFileSync(new URL("../dados/backup-real-anonimo.json", import.meta.url), "utf8");
const historico = readFileSync(new URL("../dados/backup-historico.json", import.meta.url), "utf8");

describe("uuidv5", () => {
  it("dá o mesmo id que a versão de referência (Node crypto) usada nos testes do banco", async () => {
    for (const nome of [`${UID}:treino:A`, `${UID}:sessao:abc`, "ç ã é"]) expect(await uuidv5(nome)).toBe(referencia.uuidv5(nome));
  });
});

describe("converter o backup do app antigo", () => {
  it("o backup real gera exatamente o mesmo pedido que o conversor de referência", async () => {
    const b = lerBackup(real);
    const ref = referencia.converter(JSON.parse(real), UID) as { configuracoes: { regras: Record<string, number> } };
    // Única diferença: o RIR mínimo 1 (padrão antigo) não é importado, para valer o padrão novo (0: falha vale).
    expect(ref.configuracoes.regras.rirSubir).toBe(1);
    delete ref.configuracoes.regras.rirSubir;
    expect(await converter(b, UID)).toEqual(ref);
  });

  it("RIR mínimo diferente de 1 foi escolha da pessoa e é importado", async () => {
    const b = JSON.parse(real);
    b.E.config.rec.rirSubir = 2;
    expect((await converter(lerBackup(JSON.stringify(b)), UID)).configuracoes.regras.rirSubir).toBe(2);
  });

  it("com histórico: só diferem a prontidão (amarelo → amarela) e a dor sem exercício", async () => {
    const ts = await converter(lerBackup(historico), UID);
    const ref = referencia.converter(JSON.parse(historico), UID) as { sessoes: Record<string, unknown>[] };
    expect(ts.sessoes).toHaveLength(ref.sessoes.length);
    ts.sessoes.forEach((s, i) => {
      const r = { ...ref.sessoes[i]! };
      r.prontidao = r.prontidao === "amarelo" ? "amarela" : r.prontidao === "vermelho" ? "vermelha" : r.prontidao;
      expect(s).toEqual(r);
    });
    expect(ts.sessoes.every((s) => s.prontidao === null || ["verde", "amarela", "vermelha"].includes(s.prontidao))).toBe(true);
  });

  it("dor articular antiga sem exercício vira observação (regra aprovada)", async () => {
    const ts = await converter(lerBackup(historico), UID);
    const comNota = ts.sessoes.find((s) => s.obs?.startsWith("Dor articular sem exercício"));
    expect(comNota).toBeTruthy();
    expect(comNota!.dor_articular).toBe(false);
    expect(comNota!.dor_articular_ex).toEqual([]);
  });

  it("importar duas vezes gera os mesmos ids (não duplica)", async () => {
    const a = await converter(lerBackup(historico), UID);
    const b = await converter(lerBackup(historico), UID);
    expect(a.sessoes.map((s) => s.id)).toEqual(b.sessoes.map((s) => s.id));
    expect(new Set(a.sessoes.map((s) => s.id)).size).toBe(a.sessoes.length);
  });

  it("a versão 1 (plano A a E e dias marcados) vira treinos e semana", () => {
    const e = migrarEstado({
      plano: { A: { nome: "A", ex: [{ id: "puxada", series: 4, reps: "8-10" }] }, B: { nome: "B", ex: [{ id: "prancha", series: 3, reps: "40s" }] } },
      dias: [true, false, true, false, true, false, false],
    });
    expect(e.semana).toEqual(["A", null, "B", null, "A", null, null]);
    expect(e.treinos!.B!.ex![0]!.reps).toBe("40 s");
    expect(e.treinos!.B!.tags).toEqual(["pernas"]);
  });

  it("recusa arquivo que não é backup", () => {
    expect(() => lerBackup("{}")).toThrow("não é um backup");
    expect(() => lerBackup("não é json")).toThrow("não é um backup");
  });

  it("resumo para a prévia", () => {
    const r = resumoBackup(lerBackup(real));
    expect(r.treinos).toHaveLength(5);
    expect(r.diasComTreino).toBe(7);
    expect(r.letras).toEqual(["A", "B", "C", "D", "E"]);
  });
});

describe("backup do app novo (v3)", () => {
  const novo = async () => {
    const pedido = await converter(lerBackup(historico), UID);
    return { app: "healthcore", v: 3, conta: UID, exportadoEm: "2026-11-15T10:00:00Z", dados: pedido };
  };
  it("na mesma conta mantém os ids", async () => {
    const b = await novo();
    const x = lerQualquerBackup(JSON.stringify(b));
    expect(x.tipo).toBe("novo");
    const p = await converterNovo(x.tipo === "novo" ? x.b : (null as never), UID);
    expect(p.sessoes[0]!.id).toBe(b.dados.sessoes[0]!.id);
  });
  it("em outra conta troca os ids e mantém as ligações entre eles", async () => {
    const b = await novo();
    const outra = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";
    const p = await converterNovo(b as never, outra);
    expect(p.sessoes[0]!.id).not.toBe(b.dados.sessoes[0]!.id);
    const ids = new Set(p.treinos.map((t) => t.id));
    expect(p.sessoes.every((s) => s.treino_id === null || ids.has(s.treino_id))).toBe(true);
    expect(p.semana.every((s) => s === null || ids.has(s))).toBe(true);
  });
});
