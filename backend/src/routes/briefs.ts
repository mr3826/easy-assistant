import { Router } from 'express';
import { z } from 'zod';
import { Brief } from '../models';

const briefSchema = z.object({
  niche: z.string().default(''),
  tone: z.string().default(''),
  audience: z.string().default(''),
  goals: z.string().default(''),
  schedule: z.string().default(''),
  competitors: z.string().default(''),
  keywords: z.string().default(''),
});

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const briefs = await Brief.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: briefs });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = briefSchema.parse(req.body);
    const brief = await Brief.create(payload);
    res.status(201).json({ success: true, data: brief });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const brief = await Brief.findByPk(req.params.id);

    if (!brief) {
      res.status(404).json({ success: false, error: 'Brief not found' });
      return;
    }

    res.json({ success: true, data: brief });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = briefSchema.parse(req.body);
    const brief = await Brief.findByPk(req.params.id);

    if (!brief) {
      res.status(404).json({ success: false, error: 'Brief not found' });
      return;
    }

    await brief.update(payload);
    res.json({ success: true, data: brief });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const brief = await Brief.findByPk(req.params.id);

    if (!brief) {
      res.status(404).json({ success: false, error: 'Brief not found' });
      return;
    }

    await brief.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
