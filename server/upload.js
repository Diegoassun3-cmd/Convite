const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Categorias de upload permitidas — cada uma cai numa subpasta própria e
// tem seu próprio limite de tamanho e tipos aceitos.
const CATEGORIAS = {
  logo: { pasta: 'logo', tipos: /^image\/(png|jpeg|jpg|webp|svg\+xml)$/, tamanhoMax: 4 * 1024 * 1024 },
  'foto-cartao': { pasta: 'midia', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'video-cartao': { pasta: 'midia', tipos: /^video\/(mp4|webm|quicktime)$/, tamanhoMax: 80 * 1024 * 1024 },
  'poster-cartao': { pasta: 'midia', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
  'fundo-foto': { pasta: 'fundo', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 12 * 1024 * 1024 },
  'fundo-video': { pasta: 'fundo', tipos: /^video\/(mp4|webm|quicktime)$/, tamanhoMax: 100 * 1024 * 1024 },
  galeria: { pasta: 'galeria', tipos: /^image\/(png|jpeg|jpg|webp)$/, tamanhoMax: 10 * 1024 * 1024 },
};

function extensaoSegura(nomeOriginal, mimetype) {
  const ext = path.extname(nomeOriginal || '').toLowerCase();
  if (/^\.[a-z0-9]{2,5}$/.test(ext)) return ext;
  const porMime = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm' };
  return porMime[mimetype] || '';
}

function criarUploader(categoria) {
  const def = CATEGORIAS[categoria];
  if (!def) throw new Error('Categoria de upload desconhecida: ' + categoria);

  const destino = path.join(UPLOADS_ROOT, def.pasta);
  fs.mkdirSync(destino, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destino),
    filename: (req, file, cb) => {
      const nome = crypto.randomBytes(8).toString('hex') + extensaoSegura(file.originalname, file.mimetype);
      cb(null, nome);
    },
  });

  return multer({
    storage,
    limits: { fileSize: def.tamanhoMax },
    fileFilter: (req, file, cb) => {
      if (!def.tipos.test(file.mimetype)) {
        return cb(new Error(`Tipo de arquivo não permitido para "${categoria}" (recebido: ${file.mimetype}).`));
      }
      cb(null, true);
    },
  }).single('arquivo');
}

function urlPublica(categoria, filename) {
  const def = CATEGORIAS[categoria];
  return `/uploads/${def.pasta}/${filename}`;
}

module.exports = { CATEGORIAS, criarUploader, urlPublica, UPLOADS_ROOT };
