import { Request, Response } from 'express';
import { Band } from '../models/band.model';

export class BandController {
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const band = new Band(req.body);
      const saved = await band.save();
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar banda.' });
    }
  }

  
  public async createMany(req: Request, res: Response): Promise<Response> {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'O corpo da requisição deve ser um array.' });
      }
      const saved = await Band.insertMany(items);
      return res.status(201).json(saved);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar registros em lote.' });
    }
  }

  public async findAll(_req: Request, res: Response): Promise<Response> {
    try {
      const list = await Band.find().populate('members.artistId');
      return res.status(200).json(list);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar bandas.' });
    }
  }

  public async findById(req: Request, res: Response): Promise<Response> {
    try {
      const band = await Band.findById(req.params.id).populate('members.artistId');
      if (!band) {
        return res.status(404).json({ message: 'Banda não encontrada.' });
      }
      return res.status(200).json(band);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar banda.' });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const band = await Band.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate('members.artistId');
      if (!band) {
        return res.status(404).json({ message: 'Banda não encontrada.' });
      }
      return res.status(200).json(band);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao atualizar banda.' });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const band = await Band.findByIdAndDelete(req.params.id);
      if (!band) {
        return res.status(404).json({ message: 'Banda não encontrada.' });
      }
      return res.status(200).json({ message: 'Banda removida com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao deletar banda.' });
    }
  }
}
