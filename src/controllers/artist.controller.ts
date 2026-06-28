import { Request, Response } from 'express';
import { Artist } from '../models/artist.model';

export class ArtistController {
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const artist = new Artist(req.body);
      const saved = await artist.save();
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar artista.' });
    }
  }

  
  public async createMany(req: Request, res: Response): Promise<Response> {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'O corpo da requisição deve ser um array.' });
      }
      const saved = await Artist.insertMany(items);
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar registros em lote.' });
    }
  }

  public async findAll(_req: Request, res: Response): Promise<Response> {
    try {
      const list = await Artist.find();
      return res.status(200).json(list);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar artistas.' });
    }
  }

  public async findById(req: Request, res: Response): Promise<Response> {
    try {
      const artist = await Artist.findById(req.params.id);
      if (!artist) {
        return res.status(404).json({ message: 'Artista não encontrado.' });
      }
      return res.status(200).json(artist);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar artista.' });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!artist) {
        return res.status(404).json({ message: 'Artista não encontrado.' });
      }
      return res.status(200).json(artist);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao atualizar artista.' });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const artist = await Artist.findByIdAndDelete(req.params.id);
      if (!artist) {
        return res.status(404).json({ message: 'Artista não encontrado.' });
      }
      return res.status(200).json({ message: 'Artista removido com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao deletar artista.' });
    }
  }
}
