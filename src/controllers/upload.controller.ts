import { Request, Response } from "express";
import { upload } from '../config/multer';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';


export class UploadController {
    async upload(req: Request, res: Response): Promise<void> {
    try {
        await new Promise<void>((resolve, reject) => {
            upload.single('file')(req, res, (err: any) => {
                if (err) return reject(err);
                resolve();
            });
        });

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
        await new Promise<void>((resolve, reject) => {
            uploadStream.on('finish', () => {
                const relativeUrl = `/api/upload/${uploadStream.id}`;
                const absoluteUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;
                res.status(200).json({ url: absoluteUrl, path: relativeUrl });
                resolve();
            });

            uploadStream.on('error', (error) => {
                reject(error);
            });
        });

    } catch (err: any) {
        if (!res.headersSent) {
            res.status(500).json({ 
                message: err.message || 'Erro ao processar upload.', 
                error: err 
            });
        }
    }
}
    async delete(req: Request, res: Response):Promise<void>{
        try {
            const db = mongoose.connection.db;
            if (!db) {
                res.status(500).json({ message: 'Banco de dados não conectado.' });
                return;
            }
            const fileId = new ObjectId(req.params.id);
            const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
            await bucket.delete(fileId);
            res.status(200).json({ message: 'Arquivo deletado com sucesso.' });
        } catch (error) {
            res.status(400).json({ message: 'ID de arquivo inválido.', error });
        }
    }
    async get(req:Request, res:Response):Promise<void>{
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
  }
}