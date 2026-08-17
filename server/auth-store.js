const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const AUTH_PATH = path.join(__dirname, '..', 'data', 'admin.json');
const SENHA_PADRAO = 'solua14anos';

function garantirAdmin() {
  if (fs.existsSync(AUTH_PATH)) return JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8'));

  const registro = {
    usuario: 'admin',
    senhaHash: bcrypt.hashSync(SENHA_PADRAO, 10),
    precisaTrocarSenha: true,
    criadoEm: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(AUTH_PATH), { recursive: true });
  fs.writeFileSync(AUTH_PATH, JSON.stringify(registro, null, 2), 'utf8');

  console.log('\n============================================================');
  console.log(' Credenciais iniciais do painel administrativo criadas:');
  console.log(`   usuário: ${registro.usuario}`);
  console.log(`   senha:   ${SENHA_PADRAO}`);
  console.log(' Troque essa senha assim que possível em /admin → Segurança.');
  console.log('============================================================\n');

  return registro;
}

function obter() {
  return garantirAdmin();
}

function validar(usuario, senha) {
  const registro = garantirAdmin();
  if (usuario !== registro.usuario) return false;
  return bcrypt.compareSync(String(senha || ''), registro.senhaHash);
}

function trocarSenha(usuario, senhaAtual, senhaNova) {
  const registro = garantirAdmin();
  if (!validar(usuario, senhaAtual)) {
    return { ok: false, erro: 'Usuário ou senha atual incorretos.' };
  }
  if (!senhaNova || senhaNova.length < 8) {
    return { ok: false, erro: 'A nova senha precisa ter pelo menos 8 caracteres.' };
  }
  registro.senhaHash = bcrypt.hashSync(senhaNova, 10);
  registro.precisaTrocarSenha = false;
  registro.atualizadoEm = new Date().toISOString();
  fs.writeFileSync(AUTH_PATH, JSON.stringify(registro, null, 2), 'utf8');
  return { ok: true };
}

module.exports = { obter, validar, trocarSenha, garantirAdmin };
