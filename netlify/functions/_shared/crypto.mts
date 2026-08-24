/**
 * Helpers de criptografia usando Web Crypto (nativo, sem dependências).
 * Senha: PBKDF2-SHA256. Sessão: cookie assinado com HMAC.
 */

function b64url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(str: string): Uint8Array {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ---------------------------------------------------------------- senha ---
export async function hashSenha(senha: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, chave, 256);
  return `${b64url(salt)}:${b64url(new Uint8Array(bits))}`;
}

export async function verificarSenha(senha: string, hashArmazenado: string): Promise<boolean> {
  if (!hashArmazenado || !hashArmazenado.includes(':')) return false;
  const [saltB64, hashB64] = hashArmazenado.split(':');
  const salt = b64urlToBytes(saltB64);
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, chave, 256);
  return b64url(new Uint8Array(bits)) === hashB64;
}

// ------------------------------------------------------- sessão (cookie) --
async function hmac(segredo: string, dados: string): Promise<string> {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(dados));
  return b64url(new Uint8Array(assinatura));
}

export async function criarSessaoCookie(segredo: string, payload: Record<string, unknown>, duracaoSeg: number): Promise<string> {
  const corpo = b64url(new TextEncoder().encode(JSON.stringify({ ...payload, exp: Date.now() + duracaoSeg * 1000 })));
  const assinatura = await hmac(segredo, corpo);
  return `${corpo}.${assinatura}`;
}

export async function lerSessaoCookie(segredo: string, valor: string | undefined | null): Promise<any | null> {
  if (!valor) return null;
  const [corpo, assinatura] = valor.split('.');
  if (!corpo || !assinatura) return null;
  const esperado = await hmac(segredo, corpo);
  if (esperado.length !== assinatura.length) return null;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= esperado.charCodeAt(i) ^ assinatura.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(corpo)));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
