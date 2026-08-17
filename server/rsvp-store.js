const fs = require('fs');
const path = require('path');

const RSVP_PATH = path.join(__dirname, '..', 'data', 'rsvps.json');

function listar() {
  if (!fs.existsSync(RSVP_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(RSVP_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function adicionar(dados) {
  const lista = listar();
  const registro = {
    id: 'C-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
    dataEnvio: new Date().toISOString(),
    ...dados,
  };
  lista.push(registro);
  fs.mkdirSync(path.dirname(RSVP_PATH), { recursive: true });
  fs.writeFileSync(RSVP_PATH, JSON.stringify(lista, null, 2), 'utf8');
  return registro;
}

function remover(id) {
  const lista = listar().filter((r) => r.id !== id);
  fs.writeFileSync(RSVP_PATH, JSON.stringify(lista, null, 2), 'utf8');
  return lista;
}

function paraCsv() {
  const lista = listar();
  const colunas = ['id', 'dataEnvio', 'nome', 'email', 'telefone', 'empresa', 'acompanhantes', 'restricoes', 'extra'];
  const linhas = [colunas.join(',')];
  for (const r of lista) {
    linhas.push(
      colunas
        .map((c) => {
          const v = r[c] == null ? '' : String(r[c]).replace(/"/g, '""');
          return /[",\n]/.test(v) ? `"${v}"` : v;
        })
        .join(',')
    );
  }
  return linhas.join('\n');
}

module.exports = { listar, adicionar, remover, paraCsv };
