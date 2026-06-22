import { Router } from 'express';
import { PipelineController } from '../controllers/pipeline.controller';


const router = Router()
const controller = new PipelineController

router.get('/', (req,res) => controller.searchForName(req,res))
