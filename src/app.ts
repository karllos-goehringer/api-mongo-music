import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import genreRoutes from './routes/genre.routes';
import artistRoutes from './routes/artist.routes';
import bandRoutes from './routes/band.routes';
import albumRoutes from './routes/album.routes';
import playlistRoutes from './routes/playlist.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';

const app: Application = express();

app.use(express.static(path.join(__dirname, '../public')));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.use('/api/genres', genreRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/bands', bandRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ocorreu um erro interno no servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

export default app;
