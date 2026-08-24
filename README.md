# Convite Solua — Configurável (Cloudflare Worker)

**Publicado em:** https://convite.gruposolua.workers.dev
**Painel administrativo:** https://convite.gruposolua.workers.dev/admin
(usuário `admin`, senha inicial `solua14anos` — troque em Segurança)

> Se um domínio próprio (ex. `convites.gruposolua.com.br`) for adicionado
> depois em Settings → Domains & Routes, atualize os links acima.

Convite digital em 3 etapas: **capa** em vídeo (ou foto) de tela cheia com
botão de confirmar presença, **página de detalhes** com o mesmo vídeo de
fundo (data/hora, local, traje e contagem regressiva) e **formulário** com
fundo sólido. Painel administrativo protegido por login em `/admin` —
configura tudo (textos, cores, fotos, vídeos, formulário) e lista as
confirmações recebidas.

Roda inteiramente na Cloudflare: **Workers** (backend), **D1** (banco de
dados) e **KV** (fotos/vídeos enviados + limite de tentativas de login/RSVP).
Sem servidor Node para manter no ar, sem precisar habilitar R2.

## Recursos já provisionados nesta conta

| Recurso | Nome | Uso |
|---|---|---|
| D1 | `convite-solua-db` | configuração do convite, login do admin, confirmações |
| KV | `convite-solua-rate-limit` | fotos/vídeos enviados pelo painel + limite de tentativas |

Os bindings já estão em `wrangler.toml`. O schema (`migrations/0001_init.sql`)
já foi aplicado no banco remoto.

## Publicar — conectando o repositório (sem terminal)

1. No painel Cloudflare: **Workers & Pages → Create → Import a repository**
2. Escolha o repositório **Convite**, branch `claude/customizable-paper-invitation-0hft1y`
3. Deploy — a Cloudflare lê o `wrangler.toml` e conecta D1 + KV automaticamente
4. No Worker criado → **Settings → Variables and Secrets → Add secret**:
   nome `SESSION_SECRET`, valor uma string aleatória longa (gere com
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

Depois é só acessar `/admin` — usuário `admin`, senha inicial `solua14anos`,
trocar em Segurança.

## Publicar via terminal (alternativa)

```bash
npm install
npx wrangler secret put SESSION_SECRET   # cole uma string aleatória longa
npx wrangler deploy
```

## Desenvolvimento local

```bash
cp .dev.vars.example .dev.vars   # edite o SESSION_SECRET
npx wrangler d1 execute convite-solua-db --local --file=migrations/0001_init.sql
npm run dev
```

## Se esquecer a senha do admin

```bash
npm run gerar-hash-senha -- "novaSenhaForte123"
```

O comando imprime um `wrangler d1 execute ... --remote` pronto para colar.

## O que dá para configurar pelo painel `/admin`

- **Evento**: textos, data/hora real, local, link do mapa, dress code, prazo.
- **Marca e logo**: upload do logo (página de detalhes e painel) ou monograma.
- **Aparência**: cores, textura de papel (formulário/confirmação), botões arredondados.
- **Vídeo/foto de capa**: cobre a tela toda na capa **e** na página de
  detalhes (é o mesmo arquivo nas duas, só o texto muda).
- **Mídia da página de detalhes**: foto **ou vídeo** dentro de uma moldura
  (até 18MB), com legenda, poster, autoplay/loop/mudo, e uma mini galeria.
- **Traje**: texto do dress code + link opcional que vira um botão.
- **Formulário (RSVP)**: ativa/obriga cada campo, limite de acompanhantes,
  pergunta extra livre.
- **Confirmações**: lista de quem confirmou, com exportação em CSV.
- **Integrações**: webhook opcional, WhatsApp/Instagram/site.

## Estrutura

```
wrangler.toml         → bindings (D1, KV) e onde os assets estáticos vivem
migrations/            → schema do D1
src/
  index.js              → rotas (Hono) — config, RSVP, login, uploads
  config-store.js         → leitura/escrita da config no D1
  auth-store.js            → login e troca de senha (PBKDF2, sem dependências)
  rsvp-store.js             → confirmações no D1
  upload.js                  → validação e gravação no KV
  rate-limit.js                → limite de tentativas via KV
  crypto.js                     → hash de senha e cookie de sessão assinado
public/                → convite + painel (HTML/CSS/JS estáticos, servidos direto)
scripts/gerar-hash-senha.mjs → utilitário pra redefinir a senha via terminal
```
