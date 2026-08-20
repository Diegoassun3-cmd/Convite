# Convite Solua — Envelope de Papel Configurável (Cloudflare Worker)

Convite digital em formato de envelope de papel (textura real, selo de cera,
carta que desliza para fora) com painel administrativo protegido por login
em `/admin` — configura tudo (textos, cores, fotos, vídeos, formulário) e
lista as confirmações recebidas.

Roda inteiramente na Cloudflare: **Workers** (backend), **D1** (banco de
dados), **R2** (fotos/vídeos enviados) e **KV** (limite de tentativas de
login/RSVP). Sem servidor Node para manter no ar.

## Recursos já provisionados nesta conta

| Recurso | Nome | Uso |
|---|---|---|
| D1 | `convite-solua-db` | configuração do convite, login do admin, confirmações |
| R2 | `convite-solua-uploads` | logo, fotos, vídeos enviados pelo painel |
| KV | `convite-solua-rate-limit` | limite de tentativas de login e envio de RSVP |

Os bindings já estão em `wrangler.toml`. O schema (`migrations/0001_init.sql`)
já foi aplicado no banco remoto.

## Publicar (falta só isso)

```bash
npm install

# defina o segredo de sessão do admin (gera uma string aleatória e cola
# quando o wrangler pedir):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx wrangler secret put SESSION_SECRET

npx wrangler deploy
```

Isso publica em `https://convite-solua.<seu-subdomínio>.workers.dev` (ou no
domínio próprio, se configurar uma rota em `wrangler.toml` /
Cloudflare Dashboard → Workers Routes).

Depois de publicado, acesse `/admin` — usuário `admin`, senha inicial
`solua14anos`. Troque-a assim que possível em Segurança.

## Desenvolvimento local

```bash
cp .dev.vars.example .dev.vars   # edite o SESSION_SECRET
npx wrangler d1 execute convite-solua-db --local --file=migrations/0001_init.sql
npm run dev
```

Abre em `http://localhost:8787` (convite) e `/admin` (painel). O `--local`
usa um banco/bucket simulados na sua máquina, sem tocar nos dados reais.

## Se esquecer a senha do admin

```bash
npm run gerar-hash-senha -- "novaSenhaForte123"
```

O comando imprime um `wrangler d1 execute ... --remote` pronto para colar —
redefine a senha direto no banco, sem precisar estar logado.

## O que dá para configurar pelo painel `/admin`

- **Evento**: textos, data/hora real, local, link do mapa, dress code, prazo.
- **Marca e logo**: upload do logo (envelope, carta e painel) ou monograma.
- **Aparência**: cores, textura de papel, botões arredondados, selo de cera.
- **Mídia do cartão**: foto **ou vídeo** dentro da carta, com legenda, poster,
  autoplay/loop/mudo, e uma mini galeria.
- **Fundo em tela cheia**: foto **ou vídeo** cobrindo a tela toda a partir da
  abertura do convite.
- **Formulário (RSVP)**: ativa/obriga cada campo, limite de acompanhantes,
  pergunta extra livre.
- **Confirmações**: lista de quem confirmou, com exportação em CSV.
- **Integrações**: webhook opcional (replica cada confirmação numa planilha
  via Google Apps Script, Zapier, n8n, etc.), WhatsApp/Instagram/site.

## Estrutura

```
wrangler.toml         → bindings (D1, R2, KV) e onde os assets estáticos vivem
migrations/            → schema do D1
src/
  index.js              → rotas (Hono) — config, RSVP, login, uploads
  config-store.js        → leitura/escrita da config no D1
  auth-store.js           → login e troca de senha (PBKDF2, sem dependências)
  rsvp-store.js            → confirmações no D1
  upload.js                 → validação e gravação no R2
  rate-limit.js              → limite de tentativas via KV
  crypto.js                   → hash de senha e cookie de sessão assinado
public/                → convite + painel (HTML/CSS/JS estáticos, servidos direto)
scripts/gerar-hash-senha.mjs → utilitário pra redefinir a senha via terminal
```
