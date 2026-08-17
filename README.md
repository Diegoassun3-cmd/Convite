# Convite Solua — Envelope de Papel Configurável

Um convite digital que imita um convite de papel de verdade: envelope com
textura de papel e selo de cera, carta que desliza para fora, fundo em tela
cheia (foto ou vídeo) e formulário de confirmação de presença — com um
**painel administrativo protegido por login** para configurar absolutamente
tudo, sem mexer em código.

Identidade visual: papel `#F2EDE6`, azul `#004BA3`, fontes **Nyata** (títulos)
e **Satoshi** (texto/interface), botões arredondados.

## Por que agora é uma aplicação Node (não mais só HTML estático)

O painel `/admin` precisa de um lugar para guardar com segurança a senha e as
configurações, de forma que **toda alteração feita no painel apareça
imediatamente para todos os convidados** — isso exige um pequeno servidor.
A aplicação é em Node.js + Express, bem enxuta, sem banco de dados externo
(guarda tudo em arquivos JSON dentro de `data/`).

## Como rodar localmente

```bash
npm install
npm start
```

- Convite: http://localhost:3000
- Painel administrativo: http://localhost:3000/admin

Na primeira execução, o servidor cria automaticamente um usuário
administrador e imprime a senha inicial no terminal:

```
usuário: admin
senha:   solua14anos
```

**Troque essa senha assim que possível** em `/admin` → aba **Segurança**
(ou pelo terminal, a qualquer momento: `npm run set-password -- "novaSenha"`).

## O que dá para configurar pelo painel (sem tocar em código)

- **Evento**: textos, data/hora real (para contagem regressiva e calendário),
  data por extenso, local, link do mapa, dress code, prazo de confirmação,
  um aviso extra opcional.
- **Marca e logo**: upload do logo (usado no envelope, na carta e no painel)
  ou monograma com iniciais quando não há logo.
- **Aparência**: todas as cores (papel, destaque, tinta, envelope, forro,
  fundo), textura de papel on/off, botões arredondados on/off, selo de cera
  (cor, iniciais, ativo/inativo).
- **Mídia do cartão**: foto **ou vídeo** dentro da moldura do convite, com
  poster, autoplay/loop/mudo, botão de som, legenda, e uma mini galeria de
  fotos extras.
- **Fundo em tela cheia**: uma foto **ou vídeo** que cobre a tela toda por
  trás da carta a partir do momento em que o convite é aberto, com controle
  de escurecimento para manter a leitura.
- **Formulário (RSVP)**: ativar/desativar e tornar obrigatório cada campo
  (e-mail, telefone, empresa, acompanhantes com limite configurável,
  restrições alimentares, uma pergunta extra livre).
- **Personalização por convidado**: links individuais como
  `seusite.com/?para=Maria` — o nome aparece endereçado no envelope e já
  preenchido no formulário.
- **Confirmações**: lista de quem confirmou presença, direto no painel, com
  exportação em CSV.
- **Integrações**: webhook opcional (além de salvar no painel, também envia
  cada confirmação para uma planilha via Google Apps Script, Zapier, n8n,
  etc.), WhatsApp/Instagram/site exibidos na tela de confirmação.
- **Recursos**: contagem regressiva, botão "adicionar ao calendário" (gera
  `.ics`), compartilhar link, confete ao confirmar, som sutil ao abrir o
  envelope.

## Publicando em produção

Essa aplicação precisa de um servidor Node rodando continuamente (GitHub
Pages **não funciona mais**, pois não roda backend). Opções simples e
gratuitas/baratas: [Render](https://render.com), [Railway](https://railway.app),
[Fly.io](https://fly.io), ou qualquer VPS.

1. Copie `.env.example` para `.env` e defina um `SESSION_SECRET` forte:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Configure o serviço para rodar `npm install && npm start`.
3. **Garanta que as pastas `data/` e `uploads/` sejam persistentes** (disco
   permanente / volume) — é lá que ficam a senha do admin, as configurações
   e as fotos/vídeos enviados. Se o serviço usa filesystem efêmero (reinicia
   e apaga tudo a cada deploy), procure a opção de "persistent disk" do
   provedor e aponte para essas duas pastas.
4. Acesse `/admin`, troque a senha inicial e configure o convite.

## Estrutura dos arquivos

```
server.js            → servidor Express (rotas públicas e do painel)
server/              → auth, config, upload e RSVPs (armazenamento em JSON)
data/                → estado gerado em runtime (senha, config, confirmações) — não versionado
uploads/              → fotos/vídeos enviados pelo painel — não versionado
public/
  index.html           → convite (envelope → carta → formulário → confirmação)
  admin.html           → painel administrativo
  css/                 → estilos (fonts.css, style.css, admin.css)
  js/                  → app.js (convite) e admin.js (painel)
  fonts/               → Nyata e Satoshi (arquivos da marca)
```

## Recebendo as confirmações

Toda confirmação já fica salva automaticamente e aparece na aba
**Confirmações** do painel (com exportação em CSV). Se quiser também
replicar em uma planilha do Google em tempo real, ative o **webhook** na
aba **Integrações** apontando para um Google Apps Script publicado como
app da Web.
