import { Request, Response } from 'express';
import { Genre } from '../models/genre.model';
import { Band } from '../models/band.model';
import { Album } from '../models/album.model';

export class PipelineController{
    public async searchForName(req: Request, res: Response): Promise<Response> {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ message: "O parâmetro 'name' é obrigatório." });
        }
        const searchRegex = new RegExp(String(name), 'i');

        const [bands, albums, artistsFromGenre] = await Promise.all([
            Band.find({ name: searchRegex }),
            Album.find({ name: searchRegex }),
            Genre.aggregate([
                {
                    $match: {
                        "artists.name": searchRegex 
                    }
                }
            ])
        ]);
        return res.status(200).json({
            bands,
            albums,
            artistsFromGenre
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro interno do servidor ao buscar." });
    }
}
    

}