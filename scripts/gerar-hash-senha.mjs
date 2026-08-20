#!/usr/bin/env node
/**
 * Gera o hash de uma nova senha e imprime o comando pronto para redefinir a
 * senha do painel /admin direto no banco D1 remoto — útil se você perder a
 * senha e não conseguir logar para trocá-la pela própria tela.
 *
 * Uso:  npm run gerar-hash-senha -- "minhaSenhaForte123"
 */
import { webcrypto as crypto } from 'node:crypto';

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, chave, 256);
  return `${b64url(salt)}:${b64url(new Uint8Array(bits))}`;
}

const novaSenha = process.argv[2];
if (!novaSenha || novaSenha.length < 8) {
  console.error('Uso: npm run gerar-hash-senha -- "suaNovaSenha" (mínimo 8 caracteres)');
  process.exit(1);
}

const hash = await hashSenha(novaSenha);
const sql = `UPDATE admin SET senha_hash = '${hash}', precisa_trocar_senha = 0 WHERE id = 1;`;

console.log('\nRode este comando para aplicar a nova senha no banco remoto:\n');
console.log(`  npx wrangler d1 execute convite-solua-db --remote --command "${sql}"\n`);
