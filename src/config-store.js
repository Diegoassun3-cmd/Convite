import defaults from './defaults.js';

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

export async function loadConfig(db) {
  const row = await db.prepare('SELECT data FROM config WHERE id = 1').first();
  const stored = row ? JSON.parse(row.data) : {};
  return deepMerge(defaults, stored);
}

export async function saveConfig(db, parcial) {
  const atual = await loadConfig(db);
  const mesclado = deepMerge(atual, parcial);
  await db
    .prepare('INSERT INTO config (id, data) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET data = ?1')
    .bind(JSON.stringify(mesclado))
    .run();
  return mesclado;
}

export async function resetConfig(db) {
  await db
    .prepare('INSERT INTO config (id, data) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET data = ?1')
    .bind(JSON.stringify(defaults))
    .run();
  return defaults;
}
