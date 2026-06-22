import { Router, Request, Response } from 'express';
import { upload } from '../config/multer';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Erro ao realizar o upload.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    const isAudio = req.file.mimetype.startsWith('audio/') || req.file.originalname.endsWith('.mp3') || req.file.originalname.endsWith('.wav');
    const subfolder = isAudio ? 'songs' : 'images';
    const relativeUrl = `/uploads/${subfolder}/${req.file.filename}`;
    const absoluteUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

    return res.status(200).json({ url: absoluteUrl, path: relativeUrl });
  });
});

export default router;
