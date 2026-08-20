/** Limitador simples de janela fixa, usando KV (com expiração automática). */
export async function permitir(kv, chave, maximo, janelaSeg) {
  const atual = await kv.get(chave);
  const n = atual ? parseInt(atual, 10) : 0;
  if (n >= maximo) return false;
  await kv.put(chave, String(n + 1), { expirationTtl: janelaSeg });
  return true;
}
