import { getStore } from '@netlify/blobs';
import defaults from './defaults.mts';
import { hashSenha, verificarSenha } from './crypto.mts';

function deepMerge(base: any, override: any): any {
  if (Array.isArray(base)) return override !== undefined ? override : base;
  if (typeof base !== 'object' || base === null) return override !== undefined ? override : base;
  const result: any = { ...base };
  if (override && typeof override === 'object') {
    for (const key of Object.keys(override)) {
      result[key] = deepMerge(base[key], override[key]);
    }
  }
  return result;
}

const dados = () => getStore({ name: 'convite-dados', consistency: 'strong' });
const uploads = () => getStore({ name: 'convite-uploads', consistency: 'strong' });
const limites = () => getStore({ name: 'convite-limites', consistency: 'strong' });

// ---------------------------------------------------------------- config --
export async function loadConfig() {
  const stored = (await dados().get('config', { type: 'json' })) || {};
  return deepMerge(defaults, stored);
}

export async function saveConfig(parcial: any) {
  const atual = await loadConfig();
  const mesclado = deepMerge(atual, parcial);
  await dados().setJSON('config', mesclado);
  return mesclado;
}

export async function resetConfig() {
  await dados().setJSON('config', defaults);
  return defaults;
}

// --------------------------------------------------------------- admin ---
const SENHA_PADRAO = 'solua14anos';

export async function garantirAdmin() {
  const existente = await dados().get('admin', { type: 'json' });
  if (existente) return existente;
  const registro = {
    usuario: 'admin',
    senhaHash: await hashSenha(SENHA_PADRAO),
    precisaTrocarSenha: true,
    criadoEm: new Date().toISOString(),
  };
  await dados().setJSON('admin', registro);
  return registro;
}

export async function validarLogin(usuario: string, senha: string) {
  const registro: any = await garantirAdmin();
  if (usuario !== registro.usuario) return false;
  return verificarSenha(String(senha || ''), registro.senhaHash);
}

export async function trocarSenha(usuario: string, senhaAtual: string, senhaNova: string) {
  if (!(await validarLogin(usuario, senhaAtual))) {
    return { ok: false, erro: 'Usuário ou senha atual incorretos.' };
  }
  if (!senhaNova || senhaNova.length < 8) {
    return { ok: false, erro: 'A nova senha precisa ter pelo menos 8 caracteres.' };
  }
  const registro: any = await garantirAdmin();
  registro.senhaHash = await hashSenha(senhaNova);
  registro.precisaTrocarSenha = false;
  registro.atualizadoEm = new Date().toISOString();
  await dados().setJSON('admin', registro);
  return { ok: true };
}

// --------------------------------------------------------------- rsvps ---
function idNovo() {
  return 'C-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export async function listarRsvps() {
  const { blobs } = await dados().list({ prefix: 'rsvp:' });
  const registros = await Promise.all(blobs.map((b) => dados().get(b.key, { type: 'json' })));
  return registros.filter(Boolean).sort((a: any, b: any) => (a.dataEnvio > b.dataEnvio ? 1 : -1));
}

export async function adicionarRsvp(campos: any) {
  const registro = {
    id: idNovo(),
    dataEnvio: new Date().toISOString(),
    nome: campos.nome,
    email: campos.email || '',
    telefone: campos.telefone || '',
    empresa: campos.empresa || '',
    acompanhantes: campos.acompanhantes ?? '',
    restricoes: campos.restricoes || '',
    extra: campos.extra || '',
  };
  await dados().setJSON(`rsvp:${registro.id}`, registro);
  return registro;
}

export async function removerRsvp(id: string) {
  await dados().delete(`rsvp:${id}`);
}

export async function rsvpsParaCsv() {
  const lista = await listarRsvps();
  const colunas = ['id', 'dataEnvio', 'nome', 'email', 'telefone', 'empresa', 'acompanhantes', 'restricoes', 'extra'];
  const linhas = [colunas.join(',')];
  for (const r of lista as any[]) {
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

// -------------------------------------------------------------- uploads --
export const CATEGORIAS: Record<string, { pasta: string; tipos: RegExp; tamanhoMax: number }> = {
  logo: { pasta: 'logo', tipos: /^image\/(png|jpeg|jpg|webp|svg\+xml)$/, tamanhoMax: 4 * 1024 * 1024 },
  'foto-cartao': { pasta: 'midia', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'video-cartao': { pasta: 'midia', tipos: /^video\/(mp4|webm|quicktime)$/, tamanhoMax: 80 * 1024 * 1024 },
  'poster-cartao': { pasta: 'midia', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'fundo-foto': { pasta: 'fundo', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 12 * 1024 * 1024 },
  'fundo-video': { pasta: 'fundo', tipos: /^video\/(mp4|webm|quicktime)$/, tamanhoMax: 100 * 1024 * 1024 },
  galeria: { pasta: 'galeria', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
};

const EXT_POR_MIME: Record<string, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/webp': '.webp',
  'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
};

export async function salvarUpload(categoria: string, arquivo: File) {
  const def = CATEGORIAS[categoria];
  if (!def) throw new Error('Categoria de upload desconhecida.');
  if (!arquivo || typeof arquivo.arrayBuffer !== 'function') throw new Error('Nenhum arquivo enviado.');
  if (!def.tipos.test(arquivo.type)) throw new Error(`Tipo de arquivo não permitido para "${categoria}" (recebido: ${arquivo.type}).`);
  if (arquivo.size > def.tamanhoMax) throw new Error('Arquivo excede o tamanho máximo permitido.');

  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const chave = `${def.pasta}/${hex}${EXT_POR_MIME[arquivo.type] || ''}`;

  await uploads().set(chave, await arquivo.arrayBuffer(), { metadata: { contentType: arquivo.type } });
  return `/uploads/${chave}`;
}

export async function lerUpload(chave: string) {
  return uploads().getWithMetadata(chave, { type: 'arrayBuffer' });
}

// ---------------------------------------------------------- rate limit ---
export async function permitir(chave: string, maximo: number, janelaSeg: number) {
  const store = limites();
  const agora = Date.now();
  const registro: any = (await store.get(chave, { type: 'json' })) || { contagem: 0, resetEm: agora + janelaSeg * 1000 };
  if (agora > registro.resetEm) {
    registro.contagem = 0;
    registro.resetEm = agora + janelaSeg * 1000;
  }
  if (registro.contagem >= maximo) return false;
  registro.contagem += 1;
  await store.setJSON(chave, registro);
  return true;
}
