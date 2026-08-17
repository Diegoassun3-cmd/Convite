/**
 * ============================================================================
 *  PAINEL DE CONFIGURAÇÃO DO CONVITE
 * ============================================================================
 *  Edite SOMENTE este arquivo para personalizar todo o convite: textos,
 *  cores, fontes, foto ou vídeo de capa, campos do formulário, links,
 *  forma de envio das confirmações, etc.
 *
 *  Você não precisa mexer em index.html, style.css ou app.js — eles leem
 *  tudo daqui. Se um campo não se aplica ao seu evento, deixe "" (vazio)
 *  ou false que o convite se adapta sozinho (ex: sem vídeo, sem selo, etc).
 * ============================================================================
 */

window.CONVITE_CONFIG = {

  // --------------------------------------------------------------------
  // 1. IDENTIDADE DO EVENTO
  // --------------------------------------------------------------------
  evento: {
    // Texto de abertura, em letras grandes, na frente do envelope.
    chamada: "Você está convidado",

    // Nome do anfitrião/marca — aparece no envelope e no rodapé.
    anfitriao: "Solua Imóveis",

    // Título principal do convite (dentro do papel).
    titulo: "14º Aniversário",

    // Linha de destaque abaixo do título (ex: "ANIVERSÁRIO", "CASAMENTO").
    subtitulo: "Celebração Solua Imóveis",

    // Texto de abertura / recado carinhoso, em itálico, no topo do convite.
    saudacao: "Com muita alegria, convidamos você para celebrar conosco",

    // Parágrafo livre — conte a história, o motivo da festa, etc.
    mensagem:
      "Catorze anos de histórias, parcerias e conquistas construídas ao seu lado. " +
      "Nada seria possível sem quem caminhou junto com a gente até aqui — por isso, " +
      "queremos celebrar esse momento especial com você.",

    // Data e hora reais do evento, em formato ISO (usado para calendário e
    // contagem regressiva). Ajuste o fuso (-03:00 = horário de Brasília).
    dataISO: "2026-09-20T19:00:00-03:00",

    // Como a data/hora deve aparecer escritas no convite.
    dataLabel: "20 de Setembro de 2026",
    horaLabel: "A partir das 19h",

    // Prazo para confirmar presença (texto livre).
    prazoConfirmacao: "10 de Setembro de 2026",

    local: {
      nome: "Espaço Villa Bisutti",
      endereco: "Av. das Nações Unidas, 1234 – São Paulo, SP",
      // Cole aqui o link do Google Maps (botão "Como Chegar").
      mapaUrl: "https://maps.google.com/?q=Espaço+Villa+Bisutti+São+Paulo",
    },

    trajes: {
      // Deixe "" para ocultar o cartão de dress code.
      texto: "Esporte fino",
      // Link opcional (ex: pinterest/moodboard de referência de traje).
      link: "",
    },

    // Card extra e opcional, tipo "lista de presentes", "PIX", "observações".
    avisoExtra: {
      ativo: false,
      titulo: "Observação",
      texto: "",
    },
  },

  // --------------------------------------------------------------------
  // 2. FOTO OU VÍDEO DE CAPA
  // --------------------------------------------------------------------
  midia: {
    // "foto" | "video" | "nenhum"
    tipo: "foto",

    // Usada quando tipo = "foto". Pode ser um arquivo em /assets ou uma URL.
    fotoUrl: "assets/foto-capa.jpg",
    fotoAlt: "Foto de capa do evento",

    // Usada quando tipo = "video". Recomenda-se .mp4 leve (até ~15s, sem áudio
    // é o ideal para abrir automaticamente em celulares).
    videoUrl: "assets/video-capa.mp4",
    videoPoster: "assets/video-poster.jpg",
    videoAutoplay: true,
    videoLoop: true,
    videoMudo: true,
    // Mostra um botão de "ativar som" sobre o vídeo.
    videoBotaoSom: true,

    // Legenda pequena abaixo da mídia (opcional).
    legenda: "",

    // Galeria extra opcional — some estes itens para ocultar a seção.
    galeria: [
      // { url: "assets/foto-1.jpg", alt: "" },
      // { url: "assets/foto-2.jpg", alt: "" },
    ],
  },

  // --------------------------------------------------------------------
  // 3. IDENTIDADE VISUAL (cores, fontes, selo, logo)
  // --------------------------------------------------------------------
  visual: {
    // Paleta de cores — aceita qualquer cor CSS (hex, rgb, etc).
    corPapel: "#f8f2e4",       // cor do papel do convite
    corPapelSombra: "#e9dfc7", // sombra/textura do papel
    corEnvelope: "#efe6d2",    // cor externa do envelope
    corEnvelopeForro: "#8a2f2f", // forro interno do envelope (visto ao abrir)
    corTinta: "#1f2a44",       // cor do texto principal ("tinta")
    corTintaSuave: "#5a5240",  // cor de texto secundário
    corDestaque: "#a9822f",    // dourado — bordas, selo, detalhes
    corFundo: "#12203f",       // fundo da página (atrás do envelope)
    corFundo2: "#0a1530",      // segunda cor do degradê de fundo

    // Fontes (Google Fonts). Troque os nomes se quiser outra combinação.
    fonteTitulo: "'Playfair Display', 'Georgia', serif",
    fonteScript: "'Great Vibes', cursive",
    fonteCorpo: "'Cormorant Garamond', 'Georgia', serif",
    fonteUi: "'Montserrat', Arial, sans-serif",
    // Famílias carregadas automaticamente via Google Fonts.
    googleFonts: ["Playfair+Display:wght@400;600;700", "Cormorant+Garamond:wght@400;500;600", "Great+Vibes", "Montserrat:wght@400;600;700"],

    // Selo de cera no envelope.
    selo: {
      ativo: true,
      iniciais: "S",
      cor: "#8a2f2f",
    },

    // Logo em imagem — se vazio, usa monograma com as iniciais abaixo.
    logoUrl: "",
    monograma: "S",

    // Selo postal decorativo no canto do envelope.
    selosPostais: true,

    // Ativa a textura de papel (grão sutil). Desative se preferir liso.
    texturaPapel: true,
  },

  // --------------------------------------------------------------------
  // 4. PERSONALIZAÇÃO POR CONVIDADO
  // --------------------------------------------------------------------
  // Permite enviar links individuais, ex: convite.html?para=Maria
  // O nome aparece endereçado no envelope e já vem preenchido no formulário.
  personalizacao: {
    ativo: true,
    parametroUrl: "para",
    textoPadrao: "Convidado(a) Especial",
  },

  // --------------------------------------------------------------------
  // 5. FORMULÁRIO DE CONFIRMAÇÃO (RSVP)
  // --------------------------------------------------------------------
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
      // Pergunta extra totalmente livre — deixe ativo:false para ocultar.
      perguntaExtra: {
        ativo: false,
        label: "Como você conheceu o evento?",
        placeholder: "Ex: Indicação, redes sociais...",
        obrigatorio: false,
      },
    },
  },

  // --------------------------------------------------------------------
  // 6. PARA ONDE VÃO AS CONFIRMAÇÕES
  // --------------------------------------------------------------------
  envio: {
    // "local"   -> guarda só no navegador do convidado (localStorage).
    // "webhook" -> também envia um POST em JSON para envio.webhookUrl.
    //              Funciona com Google Apps Script, Formspree, Zapier, n8n, etc.
    // "mailto"  -> abre o e-mail do convidado com os dados prontos para enviar.
    modo: "local",
    webhookUrl: "",
    emailDestino: "",
  },

  // --------------------------------------------------------------------
  // 7. CONTATO / REDES (aparecem no rodapé da confirmação)
  // --------------------------------------------------------------------
  contato: {
    whatsapp: "",  // só números, ex: 5511999999999
    instagram: "", // ex: @soluaimoveis
    site: "",
  },

  // --------------------------------------------------------------------
  // 8. RECURSOS OPCIONAIS
  // --------------------------------------------------------------------
  recursos: {
    contagemRegressiva: true,
    botaoAdicionarCalendario: true,
    botaoCompartilhar: true,
    celebracaoAoConfirmar: true, // confete leve na tela de confirmação
    somAoAbrirEnvelope: false,
  },
};
