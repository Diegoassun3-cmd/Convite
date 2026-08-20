/**
 * Configuração padrão do convite — usada apenas na primeira execução, para
 * semear a linha em D1. Depois disso, tudo é editado pelo painel /admin.
 */
export default {
  evento: {
    chamada: "Você está convidado",
    anfitriao: "Solua Imóveis",
    titulo: "14º Aniversário",
    subtitulo: "Celebração Solua Imóveis",
    saudacao: "Com muita alegria, convidamos você para celebrar conosco",
    mensagem:
      "Catorze anos de histórias, parcerias e conquistas construídas ao seu lado. " +
      "Nada seria possível sem quem caminhou junto com a gente até aqui — por isso, " +
      "queremos celebrar esse momento especial com você.",
    dataISO: "2026-09-20T19:00:00-03:00",
    dataLabel: "20 de Setembro de 2026",
    horaLabel: "A partir das 19h",
    prazoConfirmacao: "10 de Setembro de 2026",
    local: {
      nome: "Espaço Villa Bisutti",
      endereco: "Av. das Nações Unidas, 1234 – São Paulo, SP",
      mapaUrl: "https://maps.google.com/?q=Espaço+Villa+Bisutti+São+Paulo",
    },
    trajes: { texto: "Esporte fino", link: "" },
    avisoExtra: { ativo: false, titulo: "Observação", texto: "" },
  },

  marca: {
    // Logo usado no envelope, na carta e no painel administrativo.
    // Se vazio, usa um monograma com as iniciais abaixo.
    logoUrl: "",
    monograma: "S",
    nome: "Solua Imóveis",
  },

  visual: {
    corPapel: "#F2EDE6",
    corPapelSombra: "#e4dccb",
    corEnvelope: "#F2EDE6",
    corEnvelopeForro: "#004BA3",
    corTinta: "#1c2733",
    corDestaque: "#004BA3",
    corFundo1: "#004BA3",
    corFundo2: "#003d87",
    texturaPapel: true,
    botoesArredondados: true,
    selo: { ativo: true, iniciais: "S", cor: "#004BA3" },
  },

  // Mídia dentro da moldura do cartão (foto ou vídeo pequeno, ilustrativo).
  midiaCartao: {
    tipo: "foto", // "foto" | "video" | "nenhum"
    fotoUrl: "",
    fotoAlt: "Foto do evento",
    videoUrl: "",
    videoPoster: "",
    videoAutoplay: true,
    videoLoop: true,
    videoMudo: true,
    videoBotaoSom: true,
    legenda: "",
    galeria: [],
  },

  // Fundo em tela cheia (foto ou vídeo) exibido a partir do momento em que
  // o convite é aberto — cobre toda a tela, atrás da carta.
  fundoTelaCheia: {
    ativo: false,
    tipo: "foto", // "foto" | "video"
    fotoUrl: "",
    videoUrl: "",
    videoMudo: true,
    videoLoop: true,
    opacidadeOverlay: 0.55,
  },

  personalizacao: {
    ativo: true,
    parametroUrl: "para",
    textoPadrao: "Convidado(a) Especial",
  },

  formulario: {
    titulo: "Confirme sua presença",
    subtitulo: "Preencha os dados abaixo para confirmar sua ida ao evento",
    textoBotao: "Confirmar Presença",
    campos: {
      email: { ativo: true, obrigatorio: true },
      telefone: { ativo: true, obrigatorio: false },
      empresa: { ativo: true, obrigatorio: false },
      acompanhantes: { ativo: true, obrigatorio: true, maximo: 3 },
      restricoesAlimentares: { ativo: true, obrigatorio: false },
      perguntaExtra: { ativo: false, label: "", placeholder: "", obrigatorio: false },
    },
  },

  envio: {
    // As confirmações agora ficam salvas no servidor (aba "Confirmações" do
    // painel admin). O webhook é opcional, só para também replicar em outro
    // sistema (planilha, Zapier, n8n, etc.).
    webhookAtivo: false,
    webhookUrl: "",
  },

  contato: {
    whatsapp: "",
    instagram: "",
    site: "",
  },

  recursos: {
    contagemRegressiva: true,
    botaoAdicionarCalendario: true,
    botaoCompartilhar: true,
    celebracaoAoConfirmar: true,
    somAoAbrirEnvelope: false,
  },
};
