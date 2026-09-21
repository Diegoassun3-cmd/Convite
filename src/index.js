import { Hono } from 'hono';

import { loadConfig, saveConfig, resetConfig } from './config-store.js';
import { listar, adicionar, remover, paraCsv } from './rsvp-store.js';
import { CATEGORIAS, salvarUpload, lerUpload } from './upload.js';
import { permitir } from './rate-limit.js';

const app = new Hono();

// ---------------------------------------------------------------------
// Cabeçalhos de segurança (equivalente ao helmet no Node)
// ---------------------------------------------------------------------
app.use('*', async (c, next) => {
  await next();
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
  );
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
});

function ipDoVisitante(c) {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'anon';
}

// ---------------------------------------------------------------------
// Rotas públicas
// ---------------------------------------------------------------------
app.get('/api/config', async (c) => c.json(await loadConfig(c.env.DB)));

app.post('/api/rsvp', async (c) => {
  const ok = await permitir(c.env.KV, `rsvp:${ipDoVisitante(c)}`, 30, 600);
  if (!ok) return c.json({ ok: false, erro: 'Muitas tentativas. Aguarde um pouco e tente novamente.' }, 429);

  const b = await c.req.json().catch(() => ({}));
  const nome = String(b.nome || '').trim().slice(0, 200);
  if (!nome) return c.json({ ok: false, erro: 'Nome é obrigatório.' }, 400);

  const registro = await adicionar(c.env.DB, {
    nome,
    email: String(b.email || '').trim().slice(0, 200),
    telefone: String(b.telefone || '').trim().slice(0, 60),
    acompanhantes: String(b.acompanhantes ?? '').slice(0, 10),
    acompanhanteNome: String(b.acompanhanteNome || '').trim().slice(0, 200),
    acompanhanteTelefone: String(b.acompanhanteTelefone || '').trim().slice(0, 60),
    restricoes: String(b.restricoes || '').trim().slice(0, 300),
    extra: String(b.extra || '').trim().slice(0, 300),
  });

  const cfg = await loadConfig(c.env.DB);
  if (cfg.envio?.webhookAtivo && cfg.envio?.webhookUrl) {
    c.executionCtx.waitUntil(
      fetch(cfg.envio.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro),
      }).catch(() => {})
    );
  }

  return c.json({ ok: true, confirmacao: registro });
});

// ---------------------------------------------------------------------
// API administrativa — sem login (qualquer pessoa com o link /admin acessa)
// ---------------------------------------------------------------------
app.get('/api/admin/config', async (c) => c.json(await loadConfig(c.env.DB)));

app.put('/api/admin/config', async (c) => {
  const parcial = await c.req.json().catch(() => ({}));
  const atualizado = await saveConfig(c.env.DB, parcial);
  return c.json({ ok: true, config: atualizado });
});

app.post('/api/admin/config/resetar', async (c) => {
  const restaurado = await resetConfig(c.env.DB);
  return c.json({ ok: true, config: restaurado });
});

app.get('/api/admin/rsvps', async (c) => c.json(await listar(c.env.DB)));

app.get('/api/admin/rsvps.csv', async (c) => {
  const csv = await paraCsv(c.env.DB);
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="confirmacoes.csv"');
  return c.body('﻿' + csv);
});

app.delete('/api/admin/rsvps/:id', async (c) => {
  await remover(c.env.DB, c.req.param('id'));
  const total = (await listar(c.env.DB)).length;
  return c.json({ ok: true, total });
});

app.post('/api/admin/upload/:categoria', async (c) => {
  const categoria = c.req.param('categoria');
  if (!CATEGORIAS[categoria]) return c.json({ ok: false, erro: 'Categoria inválida.' }, 400);

  const form = await c.req.formData().catch(() => null);
  const arquivo = form?.get('arquivo');
  try {
    const url = await salvarUpload(c.env.KV, categoria, arquivo);
    return c.json({ ok: true, url });
  } catch (e) {
    return c.json({ ok: false, erro: e.message }, 400);
  }
});

// ---------------------------------------------------------------------
// Arquivos enviados (servidos a partir do KV)
// ---------------------------------------------------------------------
// Vídeos precisam de suporte a "Range" (bytes parciais) — sem isso, o
// navegador só consegue começar a tocar depois de baixar o arquivo
// inteiro. Com Range, ele consegue buscar só o pedaço inicial (e o
// índice de metadados do vídeo, geralmente no fim do arquivo) e já
// começa a reproduzir — e continua pedindo pedaços conforme avança.
//
// Guarda o arquivo em memória (dentro da própria instância do Worker)
// depois da primeira leitura do KV, porque o navegador faz VÁRIAS
// requisições Range durante a reprodução (um pedaço a cada poucos
// segundos de vídeo). Sem esse cache, cada uma dessas requisições iria
// ler o KV de novo — e a latência do KV, somada muitas vezes, é o que
// fazia o vídeo travar/engasgar no meio da reprodução. Esse cache em
// memória funciona em qualquer domínio (diferente do Cache API da
// Cloudflare, que só funciona com domínio próprio — por isso mantemos
// os dois).
const cacheEmMemoria = new Map();

app.get('/uploads/:pasta/:nome', async (c) => {
  const caminho = `${c.req.param('pasta')}/${c.req.param('nome')}`;

  let arquivo = cacheEmMemoria.get(caminho);
  if (!arquivo) {
    const cache = caches.default;
    const chaveCache = new Request(c.req.url, { method: 'GET' });
    const emCacheBorda = await cache.match(chaveCache);
    if (emCacheBorda) {
      arquivo = { data: await emCacheBorda.arrayBuffer(), contentType: emCacheBorda.headers.get('Content-Type') };
    } else {
      const resultado = await lerUpload(c.env.KV, caminho);
      if (!resultado) return c.notFound();
      arquivo = resultado;
      const respostaCompleta = new Response(arquivo.data, {
        status: 200,
        headers: {
          'Content-Type': arquivo.contentType,
          'Content-Length': String(arquivo.data.byteLength),
          'Cache-Control': 'public, max-age=604800, immutable',
          'Accept-Ranges': 'bytes',
        },
      });
      c.executionCtx.waitUntil(cache.put(chaveCache, respostaCompleta));
    }
    cacheEmMemoria.set(caminho, arquivo);
    // limite simples pra não deixar a memória do Worker crescer sem
    // controle se muitos arquivos diferentes forem pedidos na mesma
    // instância — descarta o mais antigo quando passa de 6.
    if (cacheEmMemoria.size > 6) cacheEmMemoria.delete(cacheEmMemoria.keys().next().value);
  }

  return respostaComRange(arquivo, c.req.header('Range'));
});

/** Monta a resposta (inteira ou recortada conforme o Range) a partir do arquivo em memória. */
function respostaComRange(arquivo, rangeHeader) {
  const tamanhoTotal = arquivo.data.byteLength;
  const cabecalhosComuns = {
    'Content-Type': arquivo.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=604800, immutable',
    'Accept-Ranges': 'bytes',
  };

  if (!rangeHeader) {
    return new Response(arquivo.data, { status: 200, headers: { ...cabecalhosComuns, 'Content-Length': String(tamanhoTotal) } });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!match) return new Response(arquivo.data, { status: 200, headers: { ...cabecalhosComuns, 'Content-Length': String(tamanhoTotal) } });

  let inicio, fim;
  if (match[1] === '') {
    // "bytes=-500" (sem início) = os últimos 500 bytes do arquivo — é
    // assim que o navegador busca o índice/metadados do vídeo, que em
    // muitos MP4s fica no final do arquivo.
    const sufixo = parseInt(match[2], 10);
    if (isNaN(sufixo) || sufixo <= 0) return new Response(arquivo.data, { status: 200, headers: { ...cabecalhosComuns, 'Content-Length': String(tamanhoTotal) } });
    inicio = Math.max(0, tamanhoTotal - sufixo);
    fim = tamanhoTotal - 1;
  } else {
    inicio = parseInt(match[1], 10);
    fim = match[2] ? parseInt(match[2], 10) : tamanhoTotal - 1;
  }
  if (isNaN(inicio) || inicio < 0) inicio = 0;
  if (isNaN(fim) || fim >= tamanhoTotal) fim = tamanhoTotal - 1;
  if (inicio > fim) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${tamanhoTotal}` } });
  }

  const fatia = arquivo.data.slice(inicio, fim + 1);
  return new Response(fatia, {
    status: 206,
    headers: { ...cabecalhosComuns, 'Content-Range': `bytes ${inicio}-${fim}/${tamanhoTotal}`, 'Content-Length': String(fatia.byteLength) },
  });
}

export default app;
