// Categorias de upload — cada uma tem prefixo próprio no KV, tipos aceitos
// e tamanho máximo. Guardado no KV (não usa R2 — evita precisar habilitar
// R2 na conta Cloudflare). O KV rejeita valores acima de 25MB, por isso os
// limites de vídeo ficam em 23MB (uma margem de segurança abaixo do teto).
// Os mesmos limites são checados no navegador antes do envio (admin.js),
// para não fazer o usuário esperar o upload inteiro só pra descobrir no
// final que o arquivo era grande demais.
export const CATEGORIAS = {
  logo: { pasta: 'logo', tipos: /^image\/(png|jpeg|jpg|webp|svg\+xml)$/, tamanhoMax: 4 * 1024 * 1024 },
  'capa-imagem': { pasta: 'capa', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'foto-cartao': { pasta: 'midia', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'video-cartao': { pasta: 'midia', tipos: /^video\/(mp4|webm|quicktime)$/, tamanhoMax: 23 * 1024 * 1024 },
  'poster-cartao': { pasta: 'midia', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'fundo-video': { pasta: 'fundo', tipos: /^video\/(mp4|webm|quicktime)$/, tamanhoMax: 23 * 1024 * 1024 },
  galeria: { pasta: 'galeria', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
};

const EXT_POR_MIME = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/webp': '.webp',
  'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
};

function nomeAleatorio(mimetype) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return hex + (EXT_POR_MIME[mimetype] || '');
}

export async function salvarUpload(kv, categoria, arquivo) {
  const def = CATEGORIAS[categoria];
  if (!def) throw new Error('Categoria de upload desconhecida.');
  if (!arquivo || typeof arquivo.arrayBuffer !== 'function') throw new Error('Nenhum arquivo enviado.');
  if (!def.tipos.test(arquivo.type)) throw new Error(`Tipo de arquivo não permitido para "${categoria}" (recebido: ${arquivo.type}).`);
  if (arquivo.size > def.tamanhoMax) throw new Error('Arquivo excede o tamanho máximo permitido.');

  const chave = `upload:${def.pasta}/${nomeAleatorio(arquivo.type)}`;
  await kv.put(chave, await arquivo.arrayBuffer(), { metadata: { contentType: arquivo.type } });
  return `/uploads/${chave.slice('upload:'.length)}`;
}

export async function lerUpload(kv, caminho) {
  const chave = `upload:${caminho}`;
  const { value, metadata } = await kv.getWithMetadata(chave, 'arrayBuffer');
  if (!value) return null;
  return { data: value, contentType: metadata?.contentType || 'application/octet-stream' };
}
