-- Schema do D1. Já aplicado no banco de produção (convite-solua-db) via MCP,
-- mas mantido aqui para reprodutibilidade: `wrangler d1 execute convite-solua-db --file=migrations/0001_init.sql`
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  usuario TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  precisa_trocar_senha INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT,
  atualizado_em TEXT
);

CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  data_envio TEXT NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  acompanhantes TEXT,
  restricoes TEXT,
  extra TEXT
);

CREATE INDEX IF NOT EXISTS idx_rsvps_data ON rsvps (data_envio);
