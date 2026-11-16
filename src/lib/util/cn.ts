import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Os estilos de texto do DESIGN.md (t-tela, t-corpo...) são utilitários próprios: o merge precisa saber que
// eles disputam o mesmo lugar, senão um t-rotulo depois de um t-corpo não substitui o tamanho.
const merge = extendTailwindMerge<"estilo-texto">({
  extend: {
    classGroups: {
      "estilo-texto": ["t-tela", "t-numero", "t-h1", "t-h2", "t-botao", "t-destaque", "t-corpo", "t-rotulo", "t-legenda"],
    },
  },
});

export const cn = (...v: ClassValue[]) => merge(clsx(v));
