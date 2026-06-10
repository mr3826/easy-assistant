import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { env } from './config/env';
import { sequelize } from './db/sequelize';
import { syncDatabase } from './models';
import apiRoutes from './routes';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '2mb' }));

app.use('/api', apiRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, error: error.issues[0]?.message ?? 'Invalid request' });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({ success: false, error: message });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    await syncDatabase();

    app.listen(env.port, () => {
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend', error);
    process.exit(1);
  }
};

void start();
