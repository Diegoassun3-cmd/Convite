import { hashSenha, verificarSenha } from './crypto.js';

const SENHA_PADRAO = 'solua14anos';

export async function garantirAdmin(db) {
  const row = await db.prepare('SELECT * FROM admin WHERE id = 1').first();
  if (row) return row;
  const hash = await hashSenha(SENHA_PADRAO);
  const agora = new Date().toISOString();
  await db
    .prepare('INSERT INTO admin (id, usuario, senha_hash, precisa_trocar_senha, criado_em) VALUES (1, ?, ?, 1, ?)')
    .bind('admin', hash, agora)
    .run();
  return { id: 1, usuario: 'admin', senha_hash: hash, precisa_trocar_senha: 1, criado_em: agora };
}

export async function validar(db, usuario, senha) {
  const registro = await garantirAdmin(db);
  if (usuario !== registro.usuario) return false;
  return verificarSenha(String(senha || ''), registro.senha_hash);
}

export async function trocarSenha(db, usuario, senhaAtual, senhaNova) {
  if (!(await validar(db, usuario, senhaAtual))) {
    return { ok: false, erro: 'Usuário ou senha atual incorretos.' };
  }
  if (!senhaNova || senhaNova.length < 8) {
    return { ok: false, erro: 'A nova senha precisa ter pelo menos 8 caracteres.' };
  }
  const hash = await hashSenha(senhaNova);
  await db
    .prepare('UPDATE admin SET senha_hash = ?, precisa_trocar_senha = 0, atualizado_em = ? WHERE id = 1')
    .bind(hash, new Date().toISOString())
    .run();
  return { ok: true };
}
