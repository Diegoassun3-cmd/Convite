const fs = require('fs');
const path = require('path');
const defaults = require('./defaults');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');

function deepMerge(base, override) {
  if (Array.isArray(base)) return override !== undefined ? override : base;
  if (typeof base !== 'object' || base === null) return override !== undefined ? override : base;
  const result = { ...base };
  if (override && typeof override === 'object') {
    for (const key of Object.keys(override)) {
      result[key] = deepMerge(base[key], override[key]);
    }
  }
  return result;
}

function load() {
  let stored = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.error('config.json inválido, usando padrão:', e.message);
      stored = {};
    }
  }
  // sempre mescla com os defaults, assim novos campos adicionados em
  // atualizações futuras não quebram instalações existentes.
  return deepMerge(defaults, stored);
}

function save(novoConfig) {
  const atual = load();
  const mesclado = deepMerge(atual, novoConfig);
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(mesclado, null, 2), 'utf8');
  return mesclado;
}

function reset() {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaults, null, 2), 'utf8');
  return defaults;
}

module.exports = { load, save, reset, CONFIG_PATH };
