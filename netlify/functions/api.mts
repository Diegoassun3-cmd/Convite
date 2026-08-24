import type { Config, Context } from '@netlify/functions';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

import {
  loadConfig, saveConfig, resetConfig,
  garantirAdmin, validarLogin, trocarSenha,
  listarRsvps, adicionarRsvp, removerRsvp, rsvpsParaCsv,
  CATEGORIAS, salvarUpload,
  permitir,
} from './_shared/stores.mts';
import { criarSessaoCookie, lerSessaoCookie } from './_shared/crypto.mts';

const app = new Hono();
const NOME_COOKIE = 'convite_sessao';
const DURACAO_SESSAO_SEG = 12 * 60 * 60; // 12h

function segredoSessao() {
  const s = Netlify.env.get('SESSION_SECRET');
  if (!s) throw new Error('SESSION_SECRET não configurado nas variáveis de ambiente do site.');
  return s;
}

function ipDoVisitante(c: any) {
  return c.req.header('x-nf-client-connection-ip') || c.req.header('CF-Connecting-IP') || 'anon';
}

// ---------------------------------------------------------------------
// Rotas públicas
// ---------------------------------------------------------------------
app.get('/api/config', async (c) => c.json(await loadConfig()));

app.post('/api/rsvp', async (c) => {
  const ok = await permitir(`rsvp:${ipDoVisitante(c)}`, 30, 600);
  if (!ok) return c.json({ ok: false, erro: 'Muitas tentativas. Aguarde um pouco e tente novamente.' }, 429);

  const b = await c.req.json().catch(() => ({}));
  const nome = String(b.nome || '').trim().slice(0, 200);
  if (!nome) return c.json({ ok: false, erro: 'Nome é obrigatório.' }, 400);

  const registro = await adicionarRsvp({
    nome,
    email: String(b.email || '').trim().slice(0, 200),
    telefone: String(b.telefone || '').trim().slice(0, 60),
    empresa: String(b.empresa || '').trim().slice(0, 200),
    acompanhantes: String(b.acompanhantes ?? '').slice(0, 10),
    restricoes: String(b.restricoes || '').trim().slice(0, 300),
    extra: String(b.extra || '').trim().slice(0, 300),
  });

  const cfg: any = await loadConfig();
  if (cfg.envio?.webhookAtivo && cfg.envio?.webhookUrl) {
    fetch(cfg.envio.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro),
    }).catch(() => {});
  }

  return c.json({ ok: true, confirmacao: registro });
});

// ---------------------------------------------------------------------
// Autenticação do painel administrativo
// ---------------------------------------------------------------------
app.post('/api/admin/login', async (c) => {
  const ok = await permitir(`login:${ipDoVisitante(c)}`, 10, 900);
  if (!ok) return c.json({ ok: false, erro: 'Muitas tentativas. Tente novamente mais tarde.' }, 429);

  const { usuario, senha } = await c.req.json().catch(() => ({} as any));
  if (!(await validarLogin(usuario, senha))) {
    return c.json({ ok: false, erro: 'Usuário ou senha incorretos.' }, 401);
  }

  const registro: any = await garantirAdmin();
  const valor = await criarSessaoCookie(segredoSessao(), { autenticado: true, usuario }, DURACAO_SESSAO_SEG);
  setCookie(c, NOME_COOKIE, valor, { httpOnly: true, sameSite: 'Lax', secure: true, path: '/', maxAge: DURACAO_SESSAO_SEG });
  return c.json({ ok: true, precisaTrocarSenha: !!registro.precisaTrocarSenha });
});

app.post('/api/admin/logout', (c) => {
  setCookie(c, NOME_COOKIE, '', { httpOnly: true, sameSite: 'Lax', secure: true, path: '/', maxAge: 0 });
  return c.json({ ok: true });
});

async function sessaoAtual(c: any) {
  const valor = getCookie(c, NOME_COOKIE);
  return lerSessaoCookie(segredoSessao(), valor);
}

app.get('/api/admin/sessao', async (c) => {
  const sessao = await sessaoAtual(c);
  if (!sessao?.autenticado) return c.json({ autenticado: false });
  const registro: any = await garantirAdmin();
  return c.json({ autenticado: true, usuario: sessao.usuario, precisaTrocarSenha: !!registro.precisaTrocarSenha });
});

async function exigirLogin(c: any, next: any) {
  const sessao = await sessaoAtual(c);
  if (!sessao?.autenticado) return c.json({ ok: false, erro: 'Não autenticado.' }, 401);
  c.set('usuario', sessao.usuario);
  await next();
}

// ---------------------------------------------------------------------
// API administrativa (protegida)
// ---------------------------------------------------------------------
app.get('/api/admin/config', exigirLogin, async (c) => c.json(await loadConfig()));

app.put('/api/admin/config', exigirLogin, async (c) => {
  const parcial = await c.req.json().catch(() => ({}));
  const atualizado = await saveConfig(parcial);
  return c.json({ ok: true, config: atualizado });
});

app.post('/api/admin/config/resetar', exigirLogin, async (c) => {
  const restaurado = await resetConfig();
  return c.json({ ok: true, config: restaurado });
});

app.post('/api/admin/senha', exigirLogin, async (c) => {
  const { senhaAtual, senhaNova } = await c.req.json().catch(() => ({} as any));
  const resultado = await trocarSenha(c.get('usuario'), senhaAtual, senhaNova);
  if (!resultado.ok) return c.json(resultado, 400);
  return c.json({ ok: true });
});

app.get('/api/admin/rsvps', exigirLogin, async (c) => c.json(await listarRsvps()));

app.get('/api/admin/rsvps.csv', exigirLogin, async (c) => {
  const csv = await rsvpsParaCsv();
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="confirmacoes.csv"');
  return c.body('﻿' + csv);
});

app.delete('/api/admin/rsvps/:id', exigirLogin, async (c) => {
  await removerRsvp(c.req.param('id'));
  const total = (await listarRsvps()).length;
  return c.json({ ok: true, total });
});

app.post('/api/admin/upload/:categoria', exigirLogin, async (c) => {
  const categoria = c.req.param('categoria');
  if (!CATEGORIAS[categoria]) return c.json({ ok: false, erro: 'Categoria inválida.' }, 400);

  const form = await c.req.formData().catch(() => null);
  const arquivo = form?.get('arquivo') as File | null;
  try {
    const url = await salvarUpload(categoria, arquivo as File);
    return c.json({ ok: true, url });
  } catch (e: any) {
    return c.json({ ok: false, erro: e.message }, 400);
  }
});

export default async (req: Request, context: Context) => app.fetch(req);

export const config: Config = {
  path: ['/api/*'],
};
