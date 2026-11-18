import { PaginaCheia } from "@/componentes/estrutura";

export default function Privacidade() {
  return (
    <PaginaCheia tituloSecundario voltar={{ href: "/entrar/", rotulo: "Voltar" }} titulo="Privacidade">
      <h1 className="t-tela">Seus dados</h1>
      <div className="t-corpo flex flex-col gap-4 text-tx2">
        <p>O HealthCore guarda o que você registra: treinos, séries, sono, medidas e as regras de carga. Nada mais.</p>
        <p>
          Os dados ficam no seu celular e numa conta na Supabase (servidor em São Paulo). O banco só entrega cada linha para a conta que a
          criou: nem outra pessoa logada consegue ver.
        </p>
        <p>Do Google, o app recebe só o seu nome, e-mail e foto, para identificar a conta. Não há anúncios nem rastreamento.</p>
        <p>Em Ajustes › Conta você exporta tudo num arquivo ou apaga a conta. Apagar remove os dados da nuvem e deste celular.</p>
      </div>
    </PaginaCheia>
  );
}
