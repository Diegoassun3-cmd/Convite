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
    empresa: String(b.empresa || '').trim().slice(0, 200),
    acompanhantes: String(b.acompanhantes ?? '').slice(0, 10),
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
app.get('/uploads/:pasta/:nome', async (c) => {
  const resultado = await lerUpload(c.env.KV, `${c.req.param('pasta')}/${c.req.param('nome')}`);
  if (!resultado) return c.notFound();
  c.header('Content-Type', resultado.contentType);
  c.header('Cache-Control', 'public, max-age=604800, immutable');
  return c.body(resultado.data);
});

export default app;
