import { Router } from 'express';
import { z } from 'zod';
import { SessionState } from '../models';

const sessionSchema = z.object({
  activeBriefId: z.string().uuid().nullable().optional(),
  checklist: z.array(z.boolean()).length(6).optional(),
});

const router = Router();

const getSession = async () => {
  const existing = await SessionState.findOne({ order: [['createdAt', 'ASC']] });
  if (existing) return existing;

  return SessionState.create({
    activeBriefId: null,
    checklist: [false, false, false, false, false, false],
  });
};

router.get('/', async (_req, res, next) => {
  try {
    const session = await getSession();
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const payload = sessionSchema.parse(req.body);
    const session = await getSession();
    await session.update(payload);
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

router.post('/brief', async (req, res, next) => {
  try {
    const payload = z.object({ briefId: z.string().uuid().nullable() }).parse(req.body);
    const session = await getSession();
    await session.update({ activeBriefId: payload.briefId });
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

export default router;
