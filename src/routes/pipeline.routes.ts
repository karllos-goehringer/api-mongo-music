import { Router } from 'express';
import { PipelineController } from '../controllers/pipeline.controller';

const router = Router();
const controller = new PipelineController();

router.get('/top-playlists', (req, res) => controller.getTopPlaylistsByTrackCount(req, res));
router.get('/genre-songs', (req, res) => controller.getGenreSongCounts(req, res));
router.get('/band-credits', (req, res) => controller.getBandsWithAlbumCredits(req, res));
router.get('/user-playlist-stats', (req, res) => controller.getUserPlaylistStats(req, res));
router.get('/genre-albums', (req, res)=>controller.getAlbumsByGenre(req, res));
export default router;
