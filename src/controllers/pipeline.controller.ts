import { Request, Response } from 'express';
import { Album } from '../models/album.model';
import { Band } from '../models/band.model';
import { Playlist } from '../models/playlist.model';
import { PipelineStage } from 'mongoose';

export class PipelineController {
  public async getTopPlaylistsByTrackCount(_req: Request, res: Response): Promise<Response> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { ownerId: { $exists: true } } },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: '$owner' },
        { $unwind: '$tracks' },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            ownerName: { $first: '$owner.name' },
            ownerEmail: { $first: '$owner.email' },
            trackCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            playlistId: '$_id',
            name: 1,
            ownerName: 1,
            ownerEmail: 1,
            trackCount: 1
          }
        },
        { $sort: { trackCount: -1 } },
        { $limit: 10 }
      ];

      const result = await Playlist.aggregate(pipeline);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro interno ao executar pipeline de playlists.' });
    }
  }

  public async getGenreSongCounts(_req: Request, res: Response): Promise<Response> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { 'tracks.genreId': { $exists: true } } },
        { $unwind: '$tracks' },
        {
          $lookup: {
            from: 'genres',
            localField: 'tracks.genreId',
            foreignField: '_id',
            as: 'genre'
          }
        },
        { $unwind: '$genre' },
        {
          $group: {
            _id: '$genre._id',
            genreName: { $first: '$genre.name' },
            songCount: { $sum: 1 },
            albums: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            _id: 0,
            genreId: '$_id',
            genreName: 1,
            songCount: 1,
            albumCount: { $size: '$albums' }
          }
        },
        { $sort: { songCount: -1 } },
        { $limit: 10 }
      ];

      const result = await Album.aggregate(pipeline);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro interno ao executar pipeline de gêneros.' });
    }
  }

  public async getBandsWithAlbumCredits(_req: Request, res: Response): Promise<Response> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { members: { $exists: true, $ne: [] } } },
        { $unwind: '$members' },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            members: { $push: '$members' },
            totalMembers: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'albums',
            let: { bandId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$$bandId', '$credits.refId']
                  }
                }
              },
              { $count: 'albumCount' }
            ],
            as: 'albumsCredited'
          }
        },
        {
          $addFields: {
            albumCreditCount: {
              $cond: [
                { $gt: [{ $size: '$albumsCredited' }, 0] },
                { $arrayElemAt: ['$albumsCredited.albumCount', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            _id: 0,
            bandId: '$_id',
            name: 1,
            totalMembers: 1,
            albumCreditCount: 1
          }
        },
        { $sort: { albumCreditCount: -1 , totalMembers: -1  } },
        { $limit: 10 }
      ];

      const result = await Band.aggregate(pipeline);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro interno ao executar pipeline de bandas.' });
    }
  }
  public async getAlbumsByGenre(_req: Request, res: Response): Promise<Response> {
    try{
      const pipeline: PipelineStage[] = [
        { $match: { members: { $exists: true, $ne: [] } } },
        { $unwind: '$members' },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            members: { $push: '$members' },
            totalMembers: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'albums',
            let: { bandId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$$bandId', '$credits.refId']
                  }
                }
              },
              { $count: 'albumCount' }
            ],
            as: 'albumsCredited'
          }
        },
        {
          $addFields: {
            albumCreditCount: {
              $cond: [
                { $gt: [{ $size: '$albumsCredited' }, 0] },
                { $arrayElemAt: ['$albumsCredited.albumCount', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            _id: 0,
            bandId: '$_id',
            name: 1,
            totalMembers: 1,
            albumCreditCount: 1
          }
        },
        { $sort: { albumCreditCount: -1 , totalMembers: -1  } },
        { $limit: 10 }
      ];

      const result = await Band.aggregate(pipeline);
      return res.status(200).json(result);
    }catch(error){
      console.error(error);
      return res.status(500).json({ message: 'Erro interno ao executar pipeline de bandas.' });
    }
  }
  public async getUserPlaylistStats(_req: Request, res: Response): Promise<Response> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { ownerId: { $exists: true } } },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: '$owner' },
        {
          $addFields: {
            trackCount: { $size: '$tracks' }
          }
        },
        {
          $group: {
            _id: '$ownerId',
            ownerName: { $first: '$owner.name' },
            totalPlaylists: { $sum: 1 },
            averageTracks: { $avg: '$trackCount' },
            maxTracks: { $max: '$trackCount' }
          }
        },
        {
          $project: {
            _id: 0,
            ownerId: '$_id',
            ownerName: 1,
            totalPlaylists: 1,
            averageTracks: 1,
            maxTracks: 1
          }
        },
        { $sort: { averageTracks: -1 } },
        { $limit: 10 }
      ];

      const result = await Playlist.aggregate(pipeline);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro interno ao executar pipeline de usuários.' });
    }
  }
  
}
