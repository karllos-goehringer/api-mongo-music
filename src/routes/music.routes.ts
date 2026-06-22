import { Router } from 'express';
import { MusicController } from '../controllers/music.controller';

const router = Router();
const controller = new MusicController();

//router.post('/', (req, res) => controller.create(req, res));


export default router;
