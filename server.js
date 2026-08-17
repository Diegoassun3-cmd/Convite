require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');

const configStore = require('./server/config-store');
const authStore = require('./server/auth-store');
const rsvpStore = require('./server/rsvp-store');
const { CATEGORIAS, criarUploader, urlPublica } = require('./server/upload');

authStore.garantirAdmin(); // garante que exista um usuário admin desde o primeiro boot

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn('Aviso: SESSION_SECRET não definido no .env — usando um valor aleatório só para esta execução (sessões não sobrevivem a um reinício). Defina SESSION_SECRET em produção.');
}

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(
  cookieSession({
    name: 'convite_sessao',
    secret: SESSION_SECRET,
    maxAge: 12 * 60 * 60 * 1000, // 12h
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false',
  })
);

// ---------------------------------------------------------------------
// Arquivos estáticos
// ---------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

// ---------------------------------------------------------------------
// Rotas públicas
// ---------------------------------------------------------------------
app.get('/api/config', (req, res) => {
  res.json(configStore.load());
});

const rsvpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

app.post('/api/rsvp', rsvpLimiter, async (req, res) => {
  const b = req.body || {};
  const nome = String(b.nome || '').trim().slice(0, 200);
  if (!nome) return res.status(400).json({ ok: false, erro: 'Nome é obrigatório.' });

  const registro = rsvpStore.adicionar({
    nome,
    email: String(b.email || '').trim().slice(0, 200),
    telefone: String(b.telefone || '').trim().slice(0, 60),
    empresa: String(b.empresa || '').trim().slice(0, 200),
    acompanhantes: String(b.acompanhantes ?? '').slice(0, 10),
    restricoes: String(b.restricoes || '').trim().slice(0, 300),
    extra: String(b.extra || '').trim().slice(0, 300),
  });

  const cfg = configStore.load();
  if (cfg.envio.webhookAtivo && cfg.envio.webhookUrl) {
    try {
      await fetch(cfg.envio.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro),
      });
    } catch (e) {
      console.error('Falha ao enviar webhook de RSVP:', e.message);
    }
  }

  res.json({ ok: true, confirmacao: registro });
});

// ---------------------------------------------------------------------
// Autenticação do painel administrativo
// ---------------------------------------------------------------------
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { usuario, senha } = req.body || {};
  if (!authStore.validar(usuario, senha)) {
    return res.status(401).json({ ok: false, erro: 'Usuário ou senha incorretos.' });
  }
  req.session.autenticado = true;
  req.session.usuario = usuario;
  const registro = authStore.obter();
  res.json({ ok: true, precisaTrocarSenha: !!registro.precisaTrocarSenha });
});

app.post('/api/admin/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/admin/sessao', (req, res) => {
  if (!req.session || !req.session.autenticado) return res.json({ autenticado: false });
  const registro = authStore.obter();
  res.json({ autenticado: true, usuario: req.session.usuario, precisaTrocarSenha: !!registro.precisaTrocarSenha });
});

function exigirLogin(req, res, next) {
  if (req.session && req.session.autenticado) return next();
  res.status(401).json({ ok: false, erro: 'Não autenticado.' });
}

// ---------------------------------------------------------------------
// API administrativa (protegida)
// ---------------------------------------------------------------------
app.get('/api/admin/config', exigirLogin, (req, res) => {
  res.json(configStore.load());
});

app.put('/api/admin/config', exigirLogin, (req, res) => {
  const atualizado = configStore.save(req.body || {});
  res.json({ ok: true, config: atualizado });
});

app.post('/api/admin/config/resetar', exigirLogin, (req, res) => {
  const restaurado = configStore.reset();
  res.json({ ok: true, config: restaurado });
});

app.post('/api/admin/senha', exigirLogin, (req, res) => {
  const { senhaAtual, senhaNova } = req.body || {};
  const resultado = authStore.trocarSenha(req.session.usuario, senhaAtual, senhaNova);
  if (!resultado.ok) return res.status(400).json(resultado);
  res.json({ ok: true });
});

app.get('/api/admin/rsvps', exigirLogin, (req, res) => {
  res.json(rsvpStore.listar());
});

app.get('/api/admin/rsvps.csv', exigirLogin, (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="confirmacoes.csv"');
  res.send('﻿' + rsvpStore.paraCsv());
});

app.delete('/api/admin/rsvps/:id', exigirLogin, (req, res) => {
  const lista = rsvpStore.remover(req.params.id);
  res.json({ ok: true, total: lista.length });
});

app.post('/api/admin/upload/:categoria', exigirLogin, (req, res) => {
  const categoria = req.params.categoria;
  if (!CATEGORIAS[categoria]) return res.status(400).json({ ok: false, erro: 'Categoria inválida.' });

  let uploader;
  try {
    uploader = criarUploader(categoria);
  } catch (e) {
    return res.status(400).json({ ok: false, erro: e.message });
  }

  uploader(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, erro: err.message });
    if (!req.file) return res.status(400).json({ ok: false, erro: 'Nenhum arquivo enviado.' });
    res.json({ ok: true, url: urlPublica(categoria, req.file.filename) });
  });
});

// ---------------------------------------------------------------------
// Páginas
// ---------------------------------------------------------------------
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// fallback simples de 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Convite rodando em http://localhost:${PORT}`);
  console.log(`Painel administrativo em http://localhost:${PORT}/admin`);
});
