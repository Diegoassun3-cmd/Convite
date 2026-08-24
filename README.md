# Convite Solua — Envelope de Papel Configurável (Netlify)

Convite digital em formato de envelope de papel (textura real, selo de cera,
carta que desliza para fora) com painel administrativo protegido por login
em `/admin` — configura tudo (textos, cores, fotos, vídeos, formulário) e
lista as confirmações recebidas.

Roda inteiramente na Netlify: **Functions** (backend) + **Blobs**
(armazenamento — configuração, login do admin, confirmações, fotos/vídeos).
Sem servidor para manter no ar, sem banco externo.

## Estrutura

```
netlify.toml                    → publica public/ e as functions
public/                         → convite + painel (HTML/CSS/JS estáticos)
netlify/functions/
  api.mts                        → todas as rotas /api/* (Hono)
  uploads.mts                    → serve as fotos/vídeos enviados (/uploads/*)
  _shared/
    stores.mts                    → leitura/escrita no Netlify Blobs
    crypto.mts                     → hash de senha (PBKDF2) e cookie de sessão
    defaults.mts                    → configuração padrão do convite
```

## Variável de ambiente necessária

`SESSION_SECRET` — assina o cookie de sessão do painel admin. Configurada no
site na Netlify (Project configuration → Environment variables).

## Acesso ao painel

`/admin` — usuário `admin`, senha inicial `solua14anos`. Troque assim que
possível em Segurança.

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
- **Integrações**: webhook opcional, WhatsApp/Instagram/site.

## Desenvolvimento local

```bash
npm install
npx netlify-cli dev
```
