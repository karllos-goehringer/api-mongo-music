import { Router, Request, Response } from 'express';
import { upload } from '../config/multer';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ message: err.message || 'Erro ao realizar o upload.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado.' });
      return;
    }

    const db = mongoose.connection.db;
    if (!db) {
      res.status(500).json({ message: 'Banco de dados não conectado.' });
      return;
    }

    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', () => {
      const relativeUrl = `/api/upload/${uploadStream.id}`;
      const absoluteUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;
      res.status(200).json({ url: absoluteUrl, path: relativeUrl });
    });

    uploadStream.on('error', (error) => {
      res.status(500).json({ message: 'Erro ao salvar o arquivo no GridFS.', error });
    });
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      res.status(500).json({ message: 'Banco de dados não conectado.' });
      return;
    }

    const fileId = new ObjectId(req.params.id);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      res.status(404).json({ message: 'Arquivo não encontrado.' });
      return;
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on('error', () => {
      res.status(500).json({ message: 'Erro ao transmitir o arquivo.' });
    });
  } catch (error) {
    res.status(400).json({ message: 'ID de arquivo inválido.', error });
  }
});

export default router;
