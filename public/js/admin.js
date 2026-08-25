(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  let CONFIG = {};
  // valores vindos de upload que não têm um <input data-path> visível na tela
  // (a "URL da foto" não é digitada, é preenchida quando o arquivo é enviado)
  let uploads = {};
  let galeria = [];

  const CATEGORIA_PATH = {
    logo: 'marca.logoUrl',
    'foto-cartao': 'midiaCartao.fotoUrl',
    'video-cartao': 'midiaCartao.videoUrl',
    'poster-cartao': 'midiaCartao.videoPoster',
    'fundo-foto': 'fundoTelaCheia.fotoUrl',
    'fundo-video': 'fundoTelaCheia.videoUrl',
  };
  const CATEGORIA_PREVIEW = {
    logo: { preview: 'preview-logo', nome: 'nome-logo', tipo: 'img' },
    'foto-cartao': { preview: 'preview-midia-foto', nome: 'nome-midia-foto', tipo: 'img' },
    'video-cartao': { preview: 'preview-midia-video', nome: 'nome-midia-video', tipo: 'video' },
    'poster-cartao': { preview: 'preview-midia-poster', nome: 'nome-midia-poster', tipo: 'img' },
    'fundo-foto': { preview: 'preview-fundo-foto', nome: 'nome-fundo-foto', tipo: 'img' },
    'fundo-video': { preview: 'preview-fundo-video', nome: 'nome-fundo-video', tipo: 'video' },
  };
  // Espelha os limites de src/upload.js — checar aqui ANTES de enviar evita
  // fazer o convidado/admin esperar o upload inteiro (podendo levar minutos
  // numa conexão mais lenta) só para descobrir, no final, que o arquivo era
  // grande demais.
  const LIMITE_MB_CATEGORIA = {
    logo: 4, 'foto-cartao': 10, 'video-cartao': 23, 'poster-cartao': 10,
    'fundo-foto': 12, 'fundo-video': 23, galeria: 10,
  };
  const TEMPO_LIMITE_UPLOAD_MS = 120000; // 2min — evita ficar "carregando" pra sempre

  // ------------------------------------------------------------------
  // utilidades de caminho (dot-path) em objetos aninhados
  // ------------------------------------------------------------------
  function getPath(obj, caminho) {
    return caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, caminho, valor) {
    const partes = caminho.split('.');
    let atual = obj;
    for (let i = 0; i < partes.length - 1; i++) {
      const k = partes[i];
      if (typeof atual[k] !== 'object' || atual[k] === null) atual[k] = {};
      atual = atual[k];
    }
    atual[partes[partes.length - 1]] = valor;
  }

  function toLocalInputValue(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function fromLocalInputValue(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  // ------------------------------------------------------------------
  // navegação entre abas
  // ------------------------------------------------------------------
  function ativarAba(nome) {
    $$('.nav-abas button').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === nome));
    $$('.painel').forEach((p) => p.classList.toggle('ativa', p.dataset.painel === nome));
    if (nome === 'confirmacoes') carregarConfirmacoes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.nav-abas button').forEach((b) => b.addEventListener('click', () => ativarAba(b.dataset.aba)));

  // ------------------------------------------------------------------
  // carregar / preencher formulário
  // ------------------------------------------------------------------
  async function carregarConfig() {
    const r = await fetch('/api/admin/config');
    CONFIG = await r.json();
    preencherForm(CONFIG);
  }

  function preencherForm(cfg) {
    $$('[data-path]').forEach((el) => {
      const valor = getPath(cfg, el.dataset.path);
      if (el.type === 'checkbox') {
        el.checked = !!valor;
      } else if (el.type === 'range') {
        el.value = valor != null ? valor : el.value;
      } else if (el.dataset.tipo === 'datetime') {
        el.value = toLocalInputValue(valor);
      } else {
        el.value = valor != null ? valor : '';
      }
    });

    // uploads sem input de texto visível
    uploads = {};
    Object.keys(CATEGORIA_PATH).forEach((cat) => {
      const caminho = CATEGORIA_PATH[cat];
      const url = getPath(cfg, caminho) || '';
      uploads[cat] = url;
      atualizarPreview(cat, url);
    });

    // galeria
    galeria = Array.isArray(cfg.midiaCartao && cfg.midiaCartao.galeria) ? cfg.midiaCartao.galeria.slice() : [];
    renderizarGaleria();

    // logos no topo/login
    atualizarLogosCabecalho(cfg);

    // blocos condicionais
    const tipoMidia = (cfg.midiaCartao && cfg.midiaCartao.tipo) || 'nenhum';
    $('select-midia-tipo').value = tipoMidia;
    alternarBlocoMidia(tipoMidia);

    const tipoFundo = (cfg.fundoTelaCheia && cfg.fundoTelaCheia.tipo) || 'foto';
    $('select-fundo-tipo').value = tipoFundo;
    alternarBlocoFundo(tipoFundo);

    const overlay = (cfg.fundoTelaCheia && cfg.fundoTelaCheia.opacidadeOverlay) != null ? cfg.fundoTelaCheia.opacidadeOverlay : 0.55;
    $('range-overlay').value = overlay;
    $('valor-overlay').textContent = Math.round(overlay * 100) + '%';
  }

  function atualizarLogosCabecalho(cfg) {
    const url = (cfg.marca && cfg.marca.logoUrl) || '';
    const iniciais = (cfg.marca && cfg.marca.monograma) || 'S';
    const el = $('topo-logo');
    if (el) el.innerHTML = url ? `<img src="${url}" alt="">` : iniciais;
  }

  function atualizarPreview(categoria, url) {
    const info = CATEGORIA_PREVIEW[categoria];
    if (!info) return;
    const preview = $(info.preview);
    const nome = $(info.nome);
    if (!url) {
      preview.innerHTML = '';
      if (nome) nome.textContent = 'Nenhum arquivo enviado';
      return;
    }
    preview.innerHTML = info.tipo === 'video' ? `<video src="${url}" muted></video>` : `<img src="${url}" alt="">`;
    if (nome) nome.textContent = url.split('/').pop();
  }

  function alternarBlocoMidia(tipo) {
    $('bloco-midia-foto').classList.toggle('oculto', tipo !== 'foto');
    $('bloco-midia-video').classList.toggle('oculto', tipo !== 'video');
  }
  $('select-midia-tipo').addEventListener('change', (e) => alternarBlocoMidia(e.target.value));

  function alternarBlocoFundo(tipo) {
    $('bloco-fundo-foto').classList.toggle('oculto', tipo !== 'foto');
    $('bloco-fundo-video').classList.toggle('oculto', tipo !== 'video');
  }
  $('select-fundo-tipo').addEventListener('change', (e) => alternarBlocoFundo(e.target.value));

  $('range-overlay').addEventListener('input', (e) => {
    $('valor-overlay').textContent = Math.round(Number(e.target.value) * 100) + '%';
  });

  // sincroniza pares de cor (color <-> texto hex)
  $$('input[type=color][data-par]').forEach((cor) => {
    const txt = $(cor.dataset.par);
    if (!txt) return;
    cor.addEventListener('input', () => { txt.value = cor.value; });
    txt.addEventListener('input', () => { if (/^#[0-9a-fA-F]{6}$/.test(txt.value)) cor.value = txt.value; });
  });

  // ------------------------------------------------------------------
  // uploads
  // ------------------------------------------------------------------
  $$('[data-abrir-upload]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const categoria = btn.dataset.abrirUpload;
      const input = document.querySelector(`[data-input-upload="${categoria}"]`);
      if (input) input.click();
    });
  });

  $$('[data-input-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const categoria = input.dataset.inputUpload;
      const arquivo = input.files[0];
      if (!arquivo) return;
      await enviarArquivo(categoria, arquivo);
      input.value = '';
    });
  });

  // Envia via XMLHttpRequest (em vez de fetch) para termos progresso real de
  // upload e um tempo-limite — assim, numa conexão lenta ou se o servidor
  // travar, o usuário vê o andamento (ou um erro claro) em vez da tela
  // "carregando" para sempre sem nenhuma pista do que está acontecendo.
  function xhrUpload(categoria, arquivo, aoProgredir) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/admin/upload/${categoria}`);
      xhr.timeout = TEMPO_LIMITE_UPLOAD_MS;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && aoProgredir) aoProgredir(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener('timeout', () => reject(new Error('O envio demorou demais e foi cancelado. Tente um arquivo menor ou uma conexão mais estável.')));
      xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o envio.')));
      xhr.addEventListener('load', () => {
        let dados;
        try { dados = JSON.parse(xhr.responseText); } catch (e) { dados = null; }
        if (xhr.status >= 200 && xhr.status < 300 && dados && dados.ok) resolve(dados);
        else reject(new Error((dados && dados.erro) || `Falha no upload (HTTP ${xhr.status}).`));
      });

      xhr.send(formData);
    });
  }

  async function enviarArquivo(categoria, arquivo) {
    const limiteMb = LIMITE_MB_CATEGORIA[categoria];
    if (limiteMb && arquivo.size > limiteMb * 1024 * 1024) {
      alert(`Esse arquivo tem ${(arquivo.size / (1024 * 1024)).toFixed(1)}MB — o máximo para essa categoria é ${limiteMb}MB. Escolha um arquivo menor.`);
      return null;
    }

    const info = CATEGORIA_PREVIEW[categoria];
    const nomeEl = info && $(info.nome);
    const textoOriginal = nomeEl ? nomeEl.textContent : '';
    const botao = document.querySelector(`[data-abrir-upload="${categoria}"]`);
    if (botao) botao.disabled = true;

    try {
      const dados = await xhrUpload(categoria, arquivo, (pct) => {
        if (nomeEl) nomeEl.textContent = `Enviando… ${pct}%`;
      });

      if (categoria === 'galeria') return dados.url;

      uploads[categoria] = dados.url;
      atualizarPreview(categoria, dados.url);
      if (categoria === 'logo') atualizarLogosCabecalho({ marca: { logoUrl: dados.url, monograma: (CONFIG.marca && CONFIG.marca.monograma) || 'S' } });

      // salva imediatamente esse campo, para não perder o upload se a página fechar
      const parcial = {};
      setPath(parcial, CATEGORIA_PATH[categoria], dados.url);
      await salvarParcial(parcial, false);
      return dados.url;
    } catch (err) {
      alert('Erro no upload: ' + err.message);
      if (nomeEl) nomeEl.textContent = textoOriginal;
      return null;
    } finally {
      if (botao) botao.disabled = false;
    }
  }

  $$('[data-limpar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const caminho = btn.dataset.limpar;
      const categoria = Object.keys(CATEGORIA_PATH).find((c) => CATEGORIA_PATH[c] === caminho);
      if (categoria) { uploads[categoria] = ''; atualizarPreview(categoria, ''); }
      const parcial = {};
      setPath(parcial, caminho, '');
      await salvarParcial(parcial, false);
      if (caminho === 'marca.logoUrl') atualizarLogosCabecalho({ marca: { logoUrl: '', monograma: (CONFIG.marca && CONFIG.marca.monograma) || 'S' } });
    });
  });

  // galeria (múltiplas fotos)
  $('btn-add-galeria').addEventListener('click', () => $('input-galeria').click());
  $('input-galeria').addEventListener('change', async () => {
    const arquivos = Array.from($('input-galeria').files);
    for (const arquivo of arquivos) {
      const url = await enviarArquivo('galeria', arquivo);
      if (url) galeria.push({ url, alt: '' });
    }
    $('input-galeria').value = '';
    renderizarGaleria();
    await salvarParcial({ midiaCartao: { galeria } }, false);
  });

  function renderizarGaleria() {
    const grade = $('galeria-grade');
    grade.innerHTML = galeria
      .map((g, i) => `<div class="galeria-item"><img src="${g.url}" alt=""><button type="button" data-remover-galeria="${i}">X</button></div>`)
      .join('');
    $$('[data-remover-galeria]', grade).forEach((btn) => {
      btn.addEventListener('click', async () => {
        galeria.splice(Number(btn.dataset.removerGaleria), 1);
        renderizarGaleria();
        await salvarParcial({ midiaCartao: { galeria } }, false);
      });
    });
  }

  // ------------------------------------------------------------------
  // salvar
  // ------------------------------------------------------------------
  function coletarForm() {
    const coletado = {};
    $$('[data-path]').forEach((el) => {
      let valor;
      if (el.type === 'checkbox') valor = el.checked;
      else if (el.type === 'number') valor = el.value === '' ? null : Number(el.value);
      else if (el.type === 'range') valor = Number(el.value);
      else if (el.dataset.tipo === 'datetime') valor = fromLocalInputValue(el.value);
      else valor = el.value;
      setPath(coletado, el.dataset.path, valor);
    });
    Object.keys(uploads).forEach((cat) => setPath(coletado, CATEGORIA_PATH[cat], uploads[cat]));
    setPath(coletado, 'midiaCartao.galeria', galeria);
    return coletado;
  }

  async function salvarParcial(parcial, mostrarToast) {
    const r = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parcial),
    });
    const dados = await r.json();
    if (dados.ok) CONFIG = dados.config;
    if (mostrarToast) mostrarToastSalvo();
    return dados;
  }

  function mostrarToastSalvo() {
    const toast = $('toast-salvar');
    toast.classList.add('mostrar');
    setTimeout(() => toast.classList.remove('mostrar'), 2200);
  }

  $('btn-salvar').addEventListener('click', async () => {
    const btn = $('btn-salvar');
    btn.disabled = true;
    try {
      await salvarParcial(coletarForm(), true);
    } catch (e) {
      alert('Não foi possível salvar agora. Tente novamente.');
    } finally {
      btn.disabled = false;
    }
  });

  $('btn-resetar').addEventListener('click', async () => {
    if (!confirm('Isso vai restaurar todos os textos, cores e mídias para o padrão de fábrica. Continuar?')) return;
    const r = await fetch('/api/admin/config/resetar', { method: 'POST' });
    const dados = await r.json();
    if (dados.ok) { CONFIG = dados.config; preencherForm(CONFIG); mostrarToastSalvo(); }
  });

  // ------------------------------------------------------------------
  // confirmações (RSVPs)
  // ------------------------------------------------------------------
  async function carregarConfirmacoes() {
    const r = await fetch('/api/admin/rsvps');
    const lista = await r.json();
    $('total-confirmacoes').textContent = lista.length;
    const corpo = $('corpo-confirmacoes');
    if (!lista.length) {
      corpo.innerHTML = '';
      $('confirmacoes-vazio').classList.remove('oculto');
      return;
    }
    $('confirmacoes-vazio').classList.add('oculto');
    corpo.innerHTML = lista
      .slice()
      .reverse()
      .map((r) => {
        const data = new Date(r.dataEnvio);
        const dataFmt = isNaN(data.getTime()) ? '-' : data.toLocaleString('pt-BR');
        const acomp = r.acompanhantes === '' || r.acompanhantes == null ? '-' : r.acompanhantes;
        return `<tr>
          <td>${escapar(r.nome)}</td>
          <td>${escapar(r.email || '-')}</td>
          <td>${escapar(r.telefone || '-')}</td>
          <td>${escapar(String(acomp))}</td>
          <td>${escapar(r.restricoes || '-')}</td>
          <td>${dataFmt}</td>
          <td><button class="btn btn-perigo btn-pequeno" data-remover-rsvp="${r.id}">EXCLUIR</button></td>
        </tr>`;
      })
      .join('');

    $$('[data-remover-rsvp]', corpo).forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir esta confirmação?')) return;
        await fetch(`/api/admin/rsvps/${btn.dataset.removerRsvp}`, { method: 'DELETE' });
        carregarConfirmacoes();
      });
    });
  }
  function escapar(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }
  $('btn-atualizar-rsvps').addEventListener('click', carregarConfirmacoes);

  // ------------------------------------------------------------------
  // início — sem login, carrega direto
  // ------------------------------------------------------------------
  carregarConfig();
})();
