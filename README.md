# Convite de Papel — 100% Configurável

Um convite digital que imita um convite de papel de verdade: envelope com selo de
cera, aba que abre, carta que desliza para fora, e um formulário de confirmação de
presença — tudo em um site estático (HTML/CSS/JS puro), sem build e sem backend
obrigatório.

## Como usar

1. Abra o arquivo **`config.js`** — é o único arquivo que você precisa editar.
2. Preencha os campos: nome do evento, data, local, cores, fontes, foto ou vídeo
   de capa, campos do formulário, etc. Cada opção tem um comentário explicando o
   que faz.
3. Coloque sua foto/vídeo de capa dentro da pasta `assets/` (veja `assets/README.md`).
4. Abra `index.html` no navegador para testar, ou publique a pasta inteira em
   qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, etc.).

Não é necessário mexer em `index.html`, `style.css` ou `app.js`.

## O que dá para personalizar

- **Textos**: chamada do envelope, saudação, título, subtítulo, mensagem livre,
  data/hora, local, endereço, dress code, prazo de confirmação, aviso extra.
- **Visual**: cor do papel, do envelope, da "tinta" (texto), cor de destaque
  (dourado), cor do forro do envelope, fontes (via Google Fonts), textura de
  papel, selo de cera (cor e iniciais), logo ou monograma.
- **Mídia**: foto ou vídeo de capa dentro do convite (`midia.tipo = "foto" | "video" | "nenhum"`),
  com legenda, poster de vídeo, autoplay/loop/mudo, botão de ativar som, e uma
  mini galeria opcional de fotos extras.
- **Personalização por convidado**: envie links individuais como
  `index.html?para=Maria`, e o nome aparece endereçado no envelope e já vem
  preenchido no formulário.
- **Formulário de RSVP**: ative/desative e torne obrigatório cada campo
  (e-mail, telefone, empresa, acompanhantes com limite configurável, restrições
  alimentares, e até uma pergunta extra totalmente livre).
- **Envio das confirmações** (`envio.modo`):
  - `"local"` — fica salvo no navegador do convidado (`localStorage`), sem
    depender de servidor.
  - `"webhook"` — também envia um POST em JSON para uma URL sua. Funciona bem
    com Google Apps Script (grava numa planilha), Formspree, Zapier ou n8n.
  - `"mailto"` — abre o e-mail do convidado com os dados prontos para enviar
    para você.
- **Recursos extras**: contagem regressiva até o evento, botão "adicionar ao
  calendário" (gera um arquivo `.ics`), botão de compartilhar o link do
  convite, confete leve ao confirmar presença, som opcional ao abrir o
  envelope, link direto para o mapa e para referência de dress code.

## Recebendo as confirmações numa planilha (grátis, sem backend)

Uma forma simples de usar `envio.modo = "webhook"`:

1. Crie uma Planilha Google.
2. Em **Extensões → Apps Script**, cole um script que recebe `doPost(e)` e
   grava `JSON.parse(e.postData.contents)` como uma nova linha.
3. Publique como app da Web (acesso: "qualquer pessoa") e copie a URL gerada.
4. Cole essa URL em `envio.webhookUrl` no `config.js`.

## Estrutura dos arquivos

```
index.html   → estrutura das 4 telas (envelope, carta, formulário, confirmação)
style.css    → toda a aparência (usa variáveis CSS preenchidas a partir do config)
config.js    → PAINEL DE CONFIGURAÇÃO — edite este arquivo
app.js       → lógica (lê o config e monta tudo — não precisa editar)
assets/      → coloque aqui suas fotos/vídeos
```
