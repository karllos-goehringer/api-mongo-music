import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`[Server]: Servidor rodando com sucesso na porta ${PORT}`);
    console.log(`[Server]: Acesse http://localhost:${PORT}/health para verificar o status`);
  });
};

startServer().catch((error) => {
  console.error('[Server]: Falha crítica ao inicializar o servidor:', error);
});
