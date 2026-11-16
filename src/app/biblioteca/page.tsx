"use client";

import { useRouter } from "next/navigation";
import { PaginaCheia } from "@/componentes/estrutura";
import { ListaExercicios } from "@/componentes/lista-exercicios";
import { useProprios } from "@/lib/dados/hooks";

export default function Biblioteca() {
  const router = useRouter();
  const proprios = useProprios();
  return (
    <PaginaCheia voltar={{ href: "/treinos/" }} titulo="Biblioteca">
      <h1 className="t-tela">Exercícios</h1>
      {proprios && <ListaExercicios proprios={proprios} aoAbrir={(c) => router.push(`/exercicio/?id=${c}`)} />}
    </PaginaCheia>
  );
}
