import { Router, Request, Response } from 'express';
import { UploadController } from '../controllers/upload.controller';

const router = Router();
const controller = new UploadController();

router.post('/', (req: Request, res: Response) => {
 controller.upload(req, res);
});

router.get('/:id', async (req: Request, res: Response) => {
 controller.get(req, res)
});
router.delete('/:id', async (req: Request, res: Response) => {
 controller.delete(req, res)
});


export default router;
