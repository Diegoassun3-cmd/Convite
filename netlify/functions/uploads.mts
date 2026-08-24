import type { Config, Context } from '@netlify/functions';
import { lerUpload } from './_shared/stores.mts';

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const chave = decodeURIComponent(url.pathname.replace(/^\/uploads\//, ''));
  if (!chave) return new Response('Not found', { status: 404 });

  const resultado = await lerUpload(chave);
  if (!resultado) return new Response('Not found', { status: 404 });

  const contentType = (resultado.metadata?.contentType as string) || 'application/octet-stream';
  return new Response(resultado.data as ArrayBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
};

export const config: Config = {
  path: ['/uploads/*'],
};
