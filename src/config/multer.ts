import multer from 'multer';

const storage = multer.memoryStorage();

// Filtro de segurança básico
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = file.mimetype.startsWith('image/');
  const isAudio = file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3') || file.originalname.endsWith('.wav');

  if (isImage || isAudio) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo inválido. Apenas imagens e áudios são permitidos.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // Limite de 20MB por arquivo
  }
});
