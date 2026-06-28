import { Request, Response } from 'express';
import { Album } from '../models/album.model';

export class AlbumController {
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const album = new Album(req.body);
      const saved = await album.save();
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar álbum.' });
    }
  }

  
  public async createMany(req: Request, res: Response): Promise<Response> {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'O corpo da requisição deve ser um array.' });
      }
      const saved = await Album.insertMany(items);
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar registros em lote.' });
    }
  }

  public async findAll(_req: Request, res: Response): Promise<Response> {
    try {
      const list = await Album.find().populate('tracks.genreId');
      return res.status(200).json(list);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar álbuns.' });
    }
  }

  public async findById(req: Request, res: Response): Promise<Response> {
    try {
      const album = await Album.findById(req.params.id).populate('tracks.genreId');
      if (!album) {
        return res.status(404).json({ message: 'Álbum não encontrado.' });
      }
      return res.status(200).json(album);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar álbum.' });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const album = await Album.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate('tracks.genreId');
      if (!album) {
        return res.status(404).json({ message: 'Álbum não encontrado.' });
      }
      return res.status(200).json(album);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao atualizar álbum.' });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const album = await Album.findByIdAndDelete(req.params.id);
      if (!album) {
        return res.status(404).json({ message: 'Álbum não encontrado.' });
      }
      return res.status(200).json({ message: 'Álbum removido com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao deletar álbum.' });
    }
    
  }
}
