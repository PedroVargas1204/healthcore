"use client";

import { useRouter } from "next/navigation";
import { PaginaCheia } from "@/componentes/estrutura";
import { ListaModelos } from "@/componentes/lista-modelos";
import { useAvisoCurto } from "@/componentes/ui/aviso-curto";
import { useConta } from "@/lib/dados/conta";
import { usePerfil, useTreinos } from "@/lib/dados/hooks";
import { usarModelo } from "@/lib/acoes/plano";
import { hojeK } from "@/lib/util/datas";

export default function Modelos() {
  const router = useRouter();
  const conta = useConta();
  const treinos = useTreinos();
  const perfil = usePerfil();
  const aviso = useAvisoCurto();
  if (conta.estado !== "dentro") return null;
  return (
    <PaginaCheia voltar={{ href: "/treinos/" }} titulo="Planos prontos">
      <h1 className="t-tela">Planos</h1>
      <p className="t-corpo text-tx2">Usar um plano cria os treinos dele e troca a sua semana. Os treinos de hoje ficam guardados e o histórico continua.</p>
      <ListaModelos
        temTreinos={!!treinos?.length}
        emUso={perfil?.modelo}
        aoUsar={async (m) => {
          await usarModelo(m, conta.uid, hojeK());
          aviso(`${m.nome} na sua semana.`);
          router.push("/treinos/");
        }}
      />
    </PaginaCheia>
  );
}
