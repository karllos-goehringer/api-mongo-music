import express, { Application, Request, Response, NextFunction } from 'express';
import musicRoutes from './routes/music.routes';

const app: Application = express();

app.use(express.json());

app.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.use('/api/musics', musicRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ocorreu um erro interno no servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

export default app;
