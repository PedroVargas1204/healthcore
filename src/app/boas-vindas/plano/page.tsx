"use client";

import { useRouter } from "next/navigation";
import { PaginaCheia } from "@/componentes/estrutura";
import { ListaModelos } from "@/componentes/lista-modelos";
import { useConta } from "@/lib/dados/conta";
import { salvarPerfil } from "@/lib/dados/repo";
import { usarModelo } from "@/lib/acoes/plano";
import { hojeK } from "@/lib/util/datas";

export default function EscolherPlano() {
  const router = useRouter();
  const conta = useConta();
  if (conta.estado !== "dentro") return null;
  return (
    <PaginaCheia voltar={{ href: "/boas-vindas/" }} titulo="Escolha um plano">
      <h1 className="t-tela">Seu plano</h1>
      <p className="t-corpo text-tx2">Dá para editar cada treino e trocar os dias depois, na aba Treinos.</p>
      <ListaModelos
        temTreinos={false}
        aoUsar={async (m) => {
          await usarModelo(m, conta.uid, hojeK());
          await salvarPerfil({ onboarding_concluido: true, nome: conta.nome });
          router.replace("/");
        }}
      />
    </PaginaCheia>
  );
}
