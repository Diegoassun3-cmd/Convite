/**
 * Convite de papel — lógica do app.
 * Lê tudo de window.CONVITE_CONFIG (config.js) e monta a experiência.
 * Não é necessário editar este arquivo para personalizar o convite.
 */
(function () {
  'use strict';

  const CFG = window.CONVITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Utilitários
  // ------------------------------------------------------------------
  function textoOuOculta(elId, valor, wrapperId) {
    const el = $(elId);
    const wrap = wrapperId ? $(wrapperId) : el;
    if (!valor) {
      if (wrap) wrap.classList.add('oculto');
      return;
    }
    if (el) el.textContent = valor;
  }

  function escaparHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function paramUrl(nome) {
    try {
      return new URLSearchParams(window.location.search).get(nome);
    } catch (e) {
      return null;
    }
  }

  // ------------------------------------------------------------------
  // 1. Fontes do Google + variáveis de cor/fonte via CSS custom properties
  // ------------------------------------------------------------------
  function aplicarIdentidadeVisual() {
    const v = CFG.visual || {};
    const root = document.documentElement.style;

    const mapa = {
      corPapel: '--papel', corPapelSombra: '--papel-sombra',
      corEnvelope: '--envelope', corEnvelopeForro: '--envelope-forro',
      corTinta: '--tinta', corTintaSuave: '--tinta-suave',
      corDestaque: '--destaque', corFundo: '--fundo-1', corFundo2: '--fundo-2',
      fonteTitulo: '--fonte-titulo', fonteScript: '--fonte-script',
      fonteCorpo: '--fonte-corpo', fonteUi: '--fonte-ui',
    };
    Object.keys(mapa).forEach((chave) => {
      if (v[chave]) root.setProperty(mapa[chave], v[chave]);
    });

    if (v.selo && v.selo.cor) root.setProperty('--cor-selo', v.selo.cor);

    if (Array.isArray(v.googleFonts) && v.googleFonts.length) {
      const familias = v.googleFonts.map((f) => 'family=' + f).join('&');
      const link = $('google-fonts-link');
      if (link) link.href = `https://fonts.googleapis.com/css2?${familias}&display=swap`;
    }

    if (!v.texturaPapel) {
      document.querySelectorAll('.textura').forEach((el) => el.classList.remove('textura'));
    }
  }

  // ------------------------------------------------------------------
  // 2. Personalização do convidado (via ?para=Nome na URL)
  // ------------------------------------------------------------------
  function nomeConvidado() {
    const p = CFG.personalizacao || {};
    if (!p.ativo) return '';
    const valor = paramUrl(p.parametroUrl || 'para');
    return valor ? decodeURIComponent(valor.replace(/\+/g, ' ')) : '';
  }

  // ------------------------------------------------------------------
  // 3. Preenche textos do envelope e da carta
  // ------------------------------------------------------------------
  function preencherConteudo() {
    const ev = CFG.evento || {};
    const v = CFG.visual || {};
    const convidado = nomeConvidado();

    // Envelope
    if ($('txt-chamada')) $('txt-chamada').textContent = (ev.chamada || 'Você está convidado').toUpperCase();
    if ($('txt-endereco')) {
      $('txt-endereco').textContent = convidado || (CFG.personalizacao && CFG.personalizacao.textoPadrao) || 'Convidado(a) Especial';
    }
    if ($('selo-iniciais')) $('selo-iniciais').textContent = (v.selo && v.selo.iniciais) || (v.monograma || 'S');
    if (v.selo && v.selo.ativo === false) {
      $('btn-selo') && ($('btn-selo').style.display = 'none');
    }
    if (v.selosPostais === false && $('selo-postal')) $('selo-postal').style.display = 'none';

    // Carta
    const monogramaEl = $('carta-monograma');
    if (monogramaEl) {
      if (v.logoUrl) {
        monogramaEl.innerHTML = `<img src="${escaparHtml(v.logoUrl)}" alt="${escaparHtml(ev.anfitriao || 'Logo')}">`;
      } else {
        monogramaEl.textContent = v.monograma || 'S';
      }
    }
    if ($('txt-anfitriao')) $('txt-anfitriao').textContent = (ev.anfitriao || '').toUpperCase();
    if ($('txt-saudacao')) {
      const saud = convidado ? `Querido(a) ${convidado},` : (ev.saudacao || '');
      textoOuOculta('txt-saudacao', saud);
    }
    if ($('txt-titulo')) $('txt-titulo').textContent = ev.titulo || '';
    textoOuOculta('txt-subtitulo', (ev.subtitulo || '').toUpperCase());
    textoOuOculta('txt-mensagem', ev.mensagem);

    if ($('txt-data')) $('txt-data').textContent = ev.dataLabel || '';
    if ($('txt-hora')) $('txt-hora').textContent = ev.horaLabel || '';
    if ($('txt-local-nome')) $('txt-local-nome').textContent = (ev.local && ev.local.nome) || '';
    if ($('txt-local-endereco')) $('txt-local-endereco').textContent = (ev.local && ev.local.endereco) || '';

    if (ev.trajes && ev.trajes.texto) {
      $('bloco-trajes') && $('bloco-trajes').classList.remove('oculto');
      $('txt-traje') && ($('txt-traje').textContent = ev.trajes.texto);
    }

    if (ev.avisoExtra && ev.avisoExtra.ativo) {
      $('aviso-extra') && $('aviso-extra').classList.remove('oculto');
      $('aviso-extra-titulo') && ($('aviso-extra-titulo').textContent = ev.avisoExtra.titulo || 'Observação');
      $('aviso-extra-texto') && ($('aviso-extra-texto').textContent = ev.avisoExtra.texto || '');
    }

    document.title = `Convite — ${ev.titulo || ev.anfitriao || ''}`;
  }

  // ------------------------------------------------------------------
  // 4. Mídia de capa: foto, vídeo ou nada — e mini galeria
  // ------------------------------------------------------------------
  function montarMidia() {
    const m = CFG.midia || {};
    const container = $('midia-container');
    if (!container) return;

    if (m.tipo === 'foto' && m.fotoUrl) {
      container.innerHTML = `
        <div class="midia-moldura">
          <img src="${escaparHtml(m.fotoUrl)}" alt="${escaparHtml(m.fotoAlt || '')}" loading="lazy">
        </div>
        ${m.legenda ? `<p class="midia-legenda">${escaparHtml(m.legenda)}</p>` : ''}`;
      const img = container.querySelector('img');
      if (img) {
        img.addEventListener('error', function onErr() {
          img.removeEventListener('error', onErr);
          const moldura = img.closest('.midia-moldura');
          if (moldura) moldura.innerHTML = '<div class="midia-placeholder">📷<span>Adicione sua foto em <code>assets/</code> e aponte <code>midia.fotoUrl</code> no config.js</span></div>';
        });
      }
    } else if (m.tipo === 'video' && m.videoUrl) {
      const autoplayAttrs = m.videoAutoplay ? 'autoplay playsinline' : 'controls';
      container.innerHTML = `
        <div class="midia-moldura" id="midia-video-wrap">
          <video id="midia-video" ${autoplayAttrs} ${m.videoLoop ? 'loop' : ''} ${m.videoMudo ? 'muted' : ''}
            ${m.videoPoster ? `poster="${escaparHtml(m.videoPoster)}"` : ''}>
            <source src="${escaparHtml(m.videoUrl)}" type="video/mp4">
          </video>
          ${m.videoBotaoSom ? '<button class="midia-som-btn" id="btn-midia-som" type="button">🔇 Ativar som</button>' : ''}
        </div>
        ${m.legenda ? `<p class="midia-legenda">${escaparHtml(m.legenda)}</p>` : ''}`;

      const video = $('midia-video');
      const btnSom = $('btn-midia-som');
      if (video && m.videoAutoplay) {
        video.play().catch(() => { /* autoplay pode ser bloqueado; ok, usuário controla */ });
      }
      if (btnSom && video) {
        btnSom.addEventListener('click', () => {
          video.muted = !video.muted;
          btnSom.textContent = video.muted ? '🔇 Ativar som' : '🔊 Silenciar';
        });
      }
      if (video) {
        video.addEventListener('error', function onErr() {
          video.removeEventListener('error', onErr);
          const moldura = video.closest('.midia-moldura');
          if (moldura) moldura.innerHTML = '<div class="midia-placeholder">🎬<span>Adicione seu vídeo em <code>assets/</code> e aponte <code>midia.videoUrl</code> no config.js</span></div>';
        });
      }
    } else {
      container.innerHTML = '';
    }

    const galeriaContainer = $('galeria-container');
    if (galeriaContainer) {
      if (Array.isArray(m.galeria) && m.galeria.length) {
        galeriaContainer.innerHTML = `<div class="mini-galeria">${m.galeria
          .map((g) => `<img src="${escaparHtml(g.url)}" alt="${escaparHtml(g.alt || '')}" loading="lazy">`)
          .join('')}</div>`;
      } else {
        galeriaContainer.innerHTML = '';
      }
    }
  }

  // ------------------------------------------------------------------
  // 5. Contagem regressiva até o evento
  // ------------------------------------------------------------------
  let timerContagem = null;
  function iniciarContagem() {
    const ev = CFG.evento || {};
    const container = $('contagem-regressiva');
    if (!container || !CFG.recursos || CFG.recursos.contagemRegressiva === false || !ev.dataISO) return;

    const alvo = new Date(ev.dataISO).getTime();
    if (isNaN(alvo)) return;

    container.classList.remove('oculto');

    function atualizar() {
      const agora = Date.now();
      const diff = alvo - agora;
      if (diff <= 0) {
        container.innerHTML = '<div class="contagem-item"><span class="n">🎉</span><span class="l">É HOJE!</span></div>';
        clearInterval(timerContagem);
        return;
      }
      const dias = Math.floor(diff / 86400000);
      const horas = Math.floor((diff % 86400000) / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);

      container.innerHTML = `
        <div class="contagem-item"><span class="n">${dias}</span><span class="l">DIAS</span></div>
        <div class="contagem-item"><span class="n">${horas}</span><span class="l">HORAS</span></div>
        <div class="contagem-item"><span class="n">${min}</span><span class="l">MIN</span></div>`;
    }
    atualizar();
    timerContagem = setInterval(atualizar, 60000);
  }

  // ------------------------------------------------------------------
  // 6. Formulário dinâmico (mostra/oculta/obriga campos por config)
  // ------------------------------------------------------------------
  function montarFormulario() {
    const f = (CFG.formulario && CFG.formulario.campos) || {};

    $('txt-form-titulo') && ($('txt-form-titulo').textContent = (CFG.formulario && CFG.formulario.titulo) || 'Confirme sua presença');
    $('txt-form-subtitulo') && ($('txt-form-subtitulo').textContent = (CFG.formulario && CFG.formulario.subtitulo) || '');
    const textoBtn = (CFG.formulario && CFG.formulario.textoBotao) || 'CONFIRMAR PRESENÇA';
    $('btn-enviar-form') && ($('btn-enviar-form').textContent = textoBtn);

    function config(campo) {
      return f[campo] || { ativo: true, obrigatorio: false };
    }

    aplicarCampo('grupo-email', 'campo-email', config('email'));
    aplicarCampo('grupo-telefone', 'campo-telefone', config('telefone'));
    aplicarCampo('grupo-empresa', 'campo-empresa', config('empresa'));
    aplicarCampo('grupo-restricoes', 'campo-restricoes', config('restricoesAlimentares'));

    // acompanhantes (select dinâmico)
    const acompCfg = config('acompanhantes');
    const grupoAcomp = $('grupo-acompanhantes');
    const selectAcomp = $('campo-acompanhantes');
    if (acompCfg.ativo === false) {
      grupoAcomp && grupoAcomp.classList.add('oculto');
    } else if (selectAcomp) {
      const max = acompCfg.maximo != null ? acompCfg.maximo : 3;
      selectAcomp.innerHTML = '<option value="">Selecione</option><option value="0">Apenas eu</option>' +
        Array.from({ length: max }, (_, i) => i + 1)
          .map((n) => `<option value="${n}">+ ${n} acompanhante${n > 1 ? 's' : ''}</option>`)
          .join('');
      if (acompCfg.obrigatorio) selectAcomp.required = true;
    }

    // pergunta extra
    const extraCfg = (f.perguntaExtra) || { ativo: false };
    const grupoExtra = $('grupo-extra');
    if (!extraCfg.ativo) {
      grupoExtra && grupoExtra.classList.add('oculto');
    } else {
      $('label-extra') && ($('label-extra').textContent = (extraCfg.label || 'Pergunta extra').toUpperCase());
      $('campo-extra') && ($('campo-extra').placeholder = extraCfg.placeholder || '');
      if (extraCfg.obrigatorio) $('campo-extra') && ($('campo-extra').required = true);
    }

    // se ambos email e telefone estiverem ocultos, oculta a linha inteira
    if (config('email').ativo === false && config('telefone').ativo === false) {
      $('linha-email-tel') && $('linha-email-tel').classList.add('oculto');
    }
    if (config('empresa').ativo === false && acompCfg.ativo === false) {
      $('linha-empresa-acomp') && $('linha-empresa-acomp').classList.add('oculto');
    }

    // pré-preenche nome se veio da URL
    const convidado = nomeConvidado();
    if (convidado && $('campo-nome')) $('campo-nome').value = convidado;
  }

  function aplicarCampo(grupoId, campoId, cfgCampo) {
    const grupo = $(grupoId);
    const campo = $(campoId);
    if (!cfgCampo || cfgCampo.ativo === false) {
      grupo && grupo.classList.add('oculto');
      return;
    }
    if (campo && cfgCampo.obrigatorio) campo.required = true;
  }

  // ------------------------------------------------------------------
  // 7. Navegação entre etapas
  // ------------------------------------------------------------------
  const etapas = ['etapa-envelope', 'etapa-carta', 'etapa-form', 'etapa-confirmacao'];
  function mostrarEtapa(id) {
    etapas.forEach((e) => {
      if (e === id) $(e).classList.remove('oculto');
      else $(e).classList.add('oculto');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEnvelope() {
    const envelope = $('envelope');
    envelope.classList.add('aberto');
    if ($('instrucao-selo')) $('instrucao-selo').textContent = 'Toque na carta para ler o convite';
    if (CFG.recursos && CFG.recursos.somAoAbrirEnvelope) tocarSomAbrir();
  }

  function tocarSomAbrir() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(340, ctx.currentTime);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.4);
    } catch (e) { /* silencioso se não suportado */ }
  }

  function irParaCarta() {
    mostrarEtapa('etapa-carta');
    iniciarContagem();
  }

  // ------------------------------------------------------------------
  // 8. Envio do formulário
  // ------------------------------------------------------------------
  function salvarLocal(dados) {
    try {
      const chave = 'convite_confirmacoes';
      const lista = JSON.parse(localStorage.getItem(chave) || '[]');
      lista.push(dados);
      localStorage.setItem(chave, JSON.stringify(lista));
    } catch (e) { /* localStorage indisponível, ignora */ }
  }

  async function enviarWebhook(dados) {
    const url = CFG.envio && CFG.envio.webhookUrl;
    if (!url) return { ok: false, motivo: 'sem-url' };
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
        mode: 'no-cors',
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, motivo: 'falha-rede' };
    }
  }

  function enviarPorEmail(dados) {
    const destino = (CFG.envio && CFG.envio.emailDestino) || '';
    const ev = CFG.evento || {};
    const assunto = encodeURIComponent(`Confirmação de presença — ${ev.titulo || ''}`);
    const linhas = Object.entries(dados)
      .filter(([k]) => k !== 'idConfirmacao' && k !== 'dataEnvio')
      .map(([k, v]) => `${k}: ${v}`)
      .join('%0D%0A');
    window.location.href = `mailto:${destino}?subject=${assunto}&body=${linhas}`;
  }

  async function handleSubmitForm(evt) {
    evt.preventDefault();
    const form = evt.target;
    const btn = $('btn-enviar-form');
    const dados = {
      idConfirmacao: 'C-' + Date.now().toString(36).toUpperCase(),
      dataEnvio: new Date().toISOString(),
      nome: form.nome.value.trim(),
      email: form.email ? form.email.value.trim() : '',
      telefone: form.telefone ? form.telefone.value.trim() : '',
      empresa: form.empresa ? form.empresa.value.trim() : '',
      acompanhantes: form.acompanhantes ? form.acompanhantes.value : '',
      restricoes: form.restricoes ? form.restricoes.value.trim() : '',
      extra: form.extra ? form.extra.value.trim() : '',
    };

    btn.disabled = true;
    const textoOriginal = btn.textContent;
    btn.textContent = 'ENVIANDO...';

    salvarLocal(dados);

    const modo = (CFG.envio && CFG.envio.modo) || 'local';
    let statusMsg = 'Confirmação salva neste dispositivo.';
    if (modo === 'webhook') {
      const r = await enviarWebhook(dados);
      statusMsg = r.ok ? 'Confirmação enviada com sucesso.' : 'Confirmação salva localmente (falha ao enviar online).';
    } else if (modo === 'mailto') {
      enviarPorEmail(dados);
      statusMsg = 'Abrindo seu aplicativo de e-mail para concluir o envio...';
    }

    btn.disabled = false;
    btn.textContent = textoOriginal;

    mostrarResumoConfirmacao(dados, statusMsg);
    mostrarEtapa('etapa-confirmacao');
    if (CFG.recursos && CFG.recursos.celebracaoAoConfirmar) dispararConfete();
  }

  function mostrarResumoConfirmacao(dados, statusMsg) {
    const ev = CFG.evento || {};
    $('resumo-nome') && ($('resumo-nome').textContent = dados.nome || '-');

    if (dados.email) {
      $('resumo-email') && ($('resumo-email').textContent = dados.email);
    } else {
      $('resumo-email-wrap') && $('resumo-email-wrap').classList.add('oculto');
    }

    if (dados.acompanhantes !== '') {
      const n = parseInt(dados.acompanhantes, 10);
      $('resumo-acompanhantes') && ($('resumo-acompanhantes').textContent = n > 0 ? `Você + ${n} acompanhante(s)` : 'Apenas você');
    } else {
      $('resumo-acompanhantes-wrap') && $('resumo-acompanhantes-wrap').classList.add('oculto');
    }

    // links
    const linkMapa = $('link-mapa');
    if (linkMapa) {
      if (ev.local && ev.local.mapaUrl) linkMapa.href = ev.local.mapaUrl;
      else linkMapa.parentElement && linkMapa.classList.add('oculto');
    }
    const linkTrajes = $('link-trajes');
    if (linkTrajes) {
      if (ev.trajes && ev.trajes.link) linkTrajes.href = ev.trajes.link;
      else linkTrajes.classList.add('oculto');
    }

    const btnCal = $('link-calendario');
    if (btnCal) {
      if (CFG.recursos && CFG.recursos.botaoAdicionarCalendario !== false && ev.dataISO) {
        btnCal.onclick = () => baixarICS();
      } else {
        btnCal.classList.add('oculto');
      }
    }

    const btnShare = $('link-compartilhar');
    if (btnShare) {
      if (CFG.recursos && CFG.recursos.botaoCompartilhar !== false) {
        btnShare.onclick = () => compartilharConvite();
      } else {
        btnShare.classList.add('oculto');
      }
    }

    $('status-envio') && ($('status-envio').textContent = statusMsg || '');

    // rodapé de contato
    const contato = CFG.contato || {};
    const partes = [];
    if (contato.whatsapp) partes.push(`<a href="https://wa.me/${contato.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`);
    if (contato.instagram) partes.push(`<a href="https://instagram.com/${String(contato.instagram).replace('@', '')}" target="_blank" rel="noopener">Instagram</a>`);
    if (contato.site) partes.push(`<a href="${contato.site}" target="_blank" rel="noopener">Site</a>`);
    $('rodape-contato') && ($('rodape-contato').innerHTML = partes.join(' • '));
  }

  // ------------------------------------------------------------------
  // 9. Adicionar ao calendário (.ics) e compartilhar
  // ------------------------------------------------------------------
  function baixarICS() {
    const ev = CFG.evento || {};
    const inicio = new Date(ev.dataISO);
    if (isNaN(inicio.getTime())) return;
    const fim = new Date(inicio.getTime() + 3 * 60 * 60 * 1000); // duração padrão 3h

    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endereco = (ev.local && (ev.local.nome + ' - ' + ev.local.endereco)) || '';

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Convite//PT-BR', 'BEGIN:VEVENT',
      `UID:${Date.now()}@convite`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(inicio)}`,
      `DTEND:${fmt(fim)}`,
      `SUMMARY:${(ev.titulo || 'Evento').replace(/\r?\n/g, ' ')}`,
      `DESCRIPTION:${(ev.mensagem || '').replace(/\r?\n/g, ' ')}`,
      `LOCATION:${endereco.replace(/\r?\n/g, ' ')}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(ev.titulo || 'evento').replace(/\s+/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function compartilharConvite() {
    const ev = CFG.evento || {};
    const dadosShare = {
      title: `Convite — ${ev.titulo || ''}`,
      text: `${ev.chamada || 'Você está convidado'}: ${ev.titulo || ''}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(dadosShare); } catch (e) { /* usuário cancelou */ }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link do convite copiado!');
      } catch (e) {
        prompt('Copie o link do convite:', window.location.href);
      }
    }
  }

  // ------------------------------------------------------------------
  // 10. Confete leve (CSS) na confirmação
  // ------------------------------------------------------------------
  function dispararConfete() {
    const cores = ['#a9822f', '#8a2f2f', '#1f2a44', '#f8f2e4'];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('div');
      c.className = 'confete';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = cores[Math.floor(Math.random() * cores.length)];
      c.style.animationDuration = 2.4 + Math.random() * 1.6 + 's';
      c.style.opacity = String(0.6 + Math.random() * 0.4);
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  // ------------------------------------------------------------------
  // 11. Reset — nova confirmação
  // ------------------------------------------------------------------
  function resetarTudo() {
    $('form-confirmar') && $('form-confirmar').reset();
    $('envelope') && $('envelope').classList.remove('aberto');
    if ($('instrucao-selo')) $('instrucao-selo').textContent = 'Toque no selo para abrir o convite';
    mostrarEtapa('etapa-envelope');
  }

  // ------------------------------------------------------------------
  // Ligações de eventos + inicialização
  // ------------------------------------------------------------------
  function iniciar() {
    aplicarIdentidadeVisual();
    preencherConteudo();
    montarMidia();
    montarFormulario();

    $('btn-selo') && $('btn-selo').addEventListener('click', abrirEnvelope);
    $('carta-espiando') && $('carta-espiando').addEventListener('click', () => {
      if ($('envelope').classList.contains('aberto')) irParaCarta();
      else abrirEnvelope();
    });
    $('carta-espiando') && $('carta-espiando').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if ($('envelope').classList.contains('aberto')) irParaCarta();
        else abrirEnvelope();
      }
    });

    $('btn-ir-formulario') && $('btn-ir-formulario').addEventListener('click', () => mostrarEtapa('etapa-form'));
    $('btn-voltar-envelope') && $('btn-voltar-envelope').addEventListener('click', () => {
      $('envelope').classList.remove('aberto');
      if ($('instrucao-selo')) $('instrucao-selo').textContent = 'Toque no selo para abrir o convite';
      mostrarEtapa('etapa-envelope');
    });
    $('btn-voltar-carta') && $('btn-voltar-carta').addEventListener('click', () => mostrarEtapa('etapa-carta'));
    $('form-confirmar') && $('form-confirmar').addEventListener('submit', handleSubmitForm);
    $('btn-nova-confirmacao') && $('btn-nova-confirmacao').addEventListener('click', resetarTudo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
