import { Request, Response } from 'express';
import { Genre } from '../models/genre.model';

export class GenreController {
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const genre = new Genre(req.body);
      const saved = await genre.save();
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar gênero.' });
    }
  }

  
  public async createMany(req: Request, res: Response): Promise<Response> {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'O corpo da requisição deve ser um array.' });
      }
      const saved = await Genre.insertMany(items);
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar registros em lote.' });
    }
  }

  public async findAll(_req: Request, res: Response): Promise<Response> {
    try {
      const list = await Genre.find();
      return res.status(200).json(list);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar gêneros.' });
    }
  }

  public async findById(req: Request, res: Response): Promise<Response> {
    try {
      const genre = await Genre.findById(req.params.id);
      if (!genre) {
        return res.status(404).json({ message: 'Gênero não encontrado.' });
      }
      return res.status(200).json(genre);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar gênero.' });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!genre) {
        return res.status(404).json({ message: 'Gênero não encontrado.' });
      }
      return res.status(200).json(genre);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao atualizar gênero.' });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const genre = await Genre.findByIdAndDelete(req.params.id);
      if (!genre) {
        return res.status(404).json({ message: 'Gênero não encontrado.' });
      }
      return res.status(200).json({ message: 'Gênero removido com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao deletar gênero.' });
    }
  }
}
