import type { About } from "@/types/content";
// Exact default paragraphs from AboutService; never substitutes a failed database read.
export const defaultAbout: About = {
  id: null,
  updatedAt: null,
  paragraph1:
    "Há dez anos, o DJ e produtor VIEE transforma sua paixão pela música em energia e conexão com o público. Especialista em funk e mega funk, vem construindo uma identidade própria e conquistando cada vez mais espaço na cena.",
  paragraph2:
    "Com quase 6 milhões de visualizações, suas produções refletem a força de uma trajetória construída com dedicação, evolução e propósito. Mais do que números, cada música lançada e cada apresentação representam a realização de um sonho.",
  paragraph3:
    "Hoje, DJ VIEE segue produzindo, evoluindo e levando sua energia para cada vez mais pessoas. O sonho virou realidade — e o próximo capítulo está apenas começando.",
};
