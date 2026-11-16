"use client";

import { useEffect, useRef, useState } from "react";

/** Relógio que atualiza a tela; para quando a aba some. */
export function useAgora(intervalo = 250) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);
  return agora;
}

/** Mantém a tela acesa durante o treino (iOS 18.4+ e Android). Volta a pedir quando o app reaparece. */
export function useTelaAcesa(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !("wakeLock" in navigator)) return;
    let trava: WakeLockSentinel | null = null;
    let vivo = true;
    const pedir = async () => {
      try {
        trava = await navigator.wakeLock.request("screen");
      } catch {
        /* bateria fraca ou sem permissão: segue sem */
      }
    };
    const aoVoltar = () => {
      if (document.visibilityState === "visible" && vivo) void pedir();
    };
    void pedir();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      void trava?.release().catch(() => {});
    };
  }, [ativo]);
}

let audio: AudioContext | null = null;

/** O iPhone só toca som depois de um toque: chamar isto em qualquer clique do treino. */
export function liberarSom() {
  try {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audio && C) audio = new C();
    if (audio?.state === "suspended") void audio.resume();
  } catch {
    /* sem áudio */
  }
}

/** Três bipes curtos no fim do descanso. */
export function bipar() {
  if (!audio) return;
  const t0 = audio.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = i === 2 ? 1180 : 880;
    g.gain.setValueAtTime(0.0001, t0 + i * 0.28);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + i * 0.28 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.28 + 0.22);
    o.connect(g).connect(audio.destination);
    o.start(t0 + i * 0.28);
    o.stop(t0 + i * 0.28 + 0.24);
  }
  if ("vibrate" in navigator) navigator.vibrate?.([120, 80, 120]);
}

/** Dispara `aoAcabar` uma vez quando o tempo `fim` passa. */
export function useFimDoTempo(fim: number | null, agora: number, aoAcabar: () => void) {
  const avisado = useRef<number | null>(null);
  useEffect(() => {
    if (fim && agora >= fim && avisado.current !== fim) {
      avisado.current = fim;
      aoAcabar();
    }
  }, [fim, agora, aoAcabar]);
}
