import { Request, Response } from 'express';
import { User } from '../models/user.model';

export class UserController {
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const user = new User(req.body);
      const saved = await user.save();
      const { passwordHash, ...result } = saved.toObject();
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao criar usuário.' });
    }
  }

  public async findAll(_req: Request, res: Response): Promise<Response> {
    try {
      const list = await User.find().select('-passwordHash');
      return res.status(200).json(list);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar usuários.' });
    }
  }

  public async findById(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findById(req.params.id).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao buscar usuário.' });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Erro ao atualizar usuário.' });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      return res.status(200).json({ message: 'Usuário removido com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Erro ao deletar usuário.' });
    }
  }
}
