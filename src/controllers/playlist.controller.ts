import { Request, Response } from 'express';
import { Playlist } from '../models/playlist.model';

export class PlaylistController {
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const playlist = new Playlist(req.body);
      const saved = await playlist.save();
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar playlist.' });
    }
  }

  
  public async createMany(req: Request, res: Response): Promise<Response> {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'O corpo da requisição deve ser um array.' });
      }
      const saved = await Playlist.insertMany(items);
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar registros em lote.' });
    }
  }

  public async findAll(_req: Request, res: Response): Promise<Response> {
    try {
      const list = await Playlist.find()
        .populate('ownerId', 'name email')
        .populate('followerIds', 'name email')
        .populate('tracks.albumId');
      return res.status(200).json(list);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar playlists.' });
    }
  }

  public async findById(req: Request, res: Response): Promise<Response> {
    try {
      const playlist = await Playlist.findById(req.params.id)
        .populate('ownerId', 'name email')
        .populate('followerIds', 'name email')
        .populate('tracks.albumId');
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist não encontrada.' });
      }
      return res.status(200).json(playlist);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar playlist.' });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const playlist = await Playlist.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate('ownerId', 'name email')
        .populate('followerIds', 'name email')
        .populate('tracks.albumId');
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist não encontrada.' });
      }
      return res.status(200).json(playlist);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao atualizar playlist.' });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const playlist = await Playlist.findByIdAndDelete(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist não encontrada.' });
      }
      return res.status(200).json({ message: 'Playlist removida com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao deletar playlist.' });
    }
  }
}