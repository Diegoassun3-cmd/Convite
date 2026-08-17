#!/usr/bin/env node
/**
 * Utilitário de linha de comando para definir a senha do painel /admin
 * sem precisar estar logado (útil no primeiro deploy ou se perder a senha).
 *
 * Uso:  npm run set-password -- "minhaSenhaForte123"
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const AUTH_PATH = path.join(__dirname, '..', 'data', 'admin.json');
const novaSenha = process.argv[2];

if (!novaSenha || novaSenha.length < 8) {
  console.error('Uso: npm run set-password -- "suaNovaSenha" (mínimo 8 caracteres)');
  process.exit(1);
}

let registro = { usuario: 'admin' };
if (fs.existsSync(AUTH_PATH)) {
  registro = JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8'));
}

registro.senhaHash = bcrypt.hashSync(novaSenha, 10);
registro.precisaTrocarSenha = false;
registro.atualizadoEm = new Date().toISOString();

fs.mkdirSync(path.dirname(AUTH_PATH), { recursive: true });
fs.writeFileSync(AUTH_PATH, JSON.stringify(registro, null, 2), 'utf8');

console.log(`Senha atualizada para o usuário "${registro.usuario}".`);
