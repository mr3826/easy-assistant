import { Router } from 'express';
import aiRoutes from './ai';
import briefRoutes from './briefs';
import sessionRoutes from './session';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/briefs', briefRoutes);
router.use('/session', sessionRoutes);
router.use('/', aiRoutes);

export default router;
