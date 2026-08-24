# Convite Solua — Configurável (Cloudflare Worker)

**Publicado em:** https://convite.gruposolua.workers.dev
**Painel administrativo:** https://convite.gruposolua.workers.dev/admin

> ⚠️ O painel `/admin` **não pede login** — qualquer pessoa com esse link
> pode editar o convite e ver as confirmações. Não compartilhe o link do
> admin, só o do convite (`/`).

> Se um domínio próprio (ex. `convites.gruposolua.com.br`) for adicionado
> depois em Settings → Domains & Routes, atualize os links acima.

Convite digital em 3 etapas: **capa** em vídeo (ou foto) de tela cheia com
botão de confirmar presença, **página de detalhes** com o mesmo vídeo de
fundo (data/hora, local, traje e contagem regressiva) e **formulário** com
fundo sólido. O painel em `/admin` configura tudo (textos, cores, fotos,
vídeos, formulário) e lista as confirmações recebidas.

Roda inteiramente na Cloudflare: **Workers** (backend), **D1** (banco de
dados) e **KV** (fotos/vídeos enviados + limite de tentativas de RSVP).
Sem servidor Node para manter no ar, sem precisar habilitar R2.

## Recursos já provisionados nesta conta

| Recurso | Nome | Uso |
|---|---|---|
| D1 | `convite-solua-db` | configuração do convite, confirmações |
| KV | `convite-solua-rate-limit` | fotos/vídeos enviados pelo painel + limite de tentativas |

Os bindings já estão em `wrangler.toml`. O schema (`migrations/0001_init.sql`)
já foi aplicado no banco remoto.

## Publicar — conectando o repositório (sem terminal)

1. No painel Cloudflare: **Workers & Pages → Create → Import a repository**
2. Escolha o repositório **Convite**, branch `claude/customizable-paper-invitation-0hft1y`
3. Deploy — a Cloudflare lê o `wrangler.toml` e conecta D1 + KV automaticamente

Depois é só acessar `/admin` e configurar tudo direto.

## Publicar via terminal (alternativa)

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Desenvolvimento local

```bash
npx wrangler d1 execute convite-solua-db --local --file=migrations/0001_init.sql
npm run dev
```

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
wrangler.toml    → bindings (D1, KV) e onde os assets estáticos vivem
migrations/       → schema do D1
src/
  index.js         → rotas (Hono) — config, RSVP, uploads (sem login)
  config-store.js    → leitura/escrita da config no D1
  rsvp-store.js        → confirmações no D1
  upload.js              → validação e gravação no KV
  rate-limit.js            → limite de tentativas do RSVP via KV
public/           → convite + painel (HTML/CSS/JS estáticos, servidos direto)
```
