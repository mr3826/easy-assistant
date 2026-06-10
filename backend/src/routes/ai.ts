import { Router } from 'express';
import { z } from 'zod';
import { Analytics, Brief, Caption, Idea, Script } from '../models';
import {
  generateAnalytics,
  generateCaptions,
  generateIdeas,
  generateScript,
} from '../services/gemini';

const router = Router();

router.post('/ideation/generate', async (req, res, next) => {
  try {
    const payload = z
      .object({
        briefId: z.string().uuid(),
        trendingTopic: z.string().optional(),
      })
      .parse(req.body);

    const brief = await Brief.findByPk(payload.briefId);
    if (!brief) {
      res.status(404).json({ success: false, error: 'Brief not found' });
      return;
    }

    const ideas = await generateIdeas({
      brief: {
        niche: brief.niche,
        tone: brief.tone,
        audience: brief.audience,
        goals: brief.goals,
        competitors: brief.competitors,
        keywords: brief.keywords,
      },
      trendingTopic: payload.trendingTopic,
    });

    const savedIdeas = await Idea.bulkCreate(
      ideas.map((idea, index) => ({
        briefId: brief.id,
        num: idea.num ?? index + 1,
        hook: idea.hook,
        concept: idea.concept,
        format: idea.format,
        duration: idea.duration,
        cta: idea.cta,
        score: idea.score,
      })),
      { returning: true },
    );

    res.json({ success: true, data: savedIdeas });
  } catch (error) {
    next(error);
  }
});

router.post('/scripts/generate', async (req, res, next) => {
  try {
    const payload = z
      .object({
        ideaId: z.string().uuid(),
        duration: z.string(),
        style: z.string(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const idea = await Idea.findByPk(payload.ideaId, { include: [{ model: Brief, as: 'brief' }] });

    if (!idea || !idea.brief) {
      res.status(404).json({ success: false, error: 'Idea not found' });
      return;
    }

    const content = await generateScript({
      brief: {
        niche: idea.brief.niche,
        tone: idea.brief.tone,
        audience: idea.brief.audience,
        goals: idea.brief.goals,
        competitors: idea.brief.competitors,
        keywords: idea.brief.keywords,
      },
      hook: idea.hook,
      concept: idea.concept,
      cta: idea.cta,
      duration: payload.duration,
      style: payload.style,
      notes: payload.notes,
    });

    const savedScript = await Script.create({
      ideaId: idea.id,
      duration: payload.duration,
      style: payload.style,
      content,
    });

    res.json({ success: true, data: savedScript });
  } catch (error) {
    next(error);
  }
});

router.post('/captions/generate', async (req, res, next) => {
  try {
    const payload = z
      .object({
        ideaId: z.string().uuid(),
        topic: z.string().min(1),
      })
      .parse(req.body);

    const idea = await Idea.findByPk(payload.ideaId, { include: [{ model: Brief, as: 'brief' }] });

    if (!idea || !idea.brief) {
      res.status(404).json({ success: false, error: 'Idea not found' });
      return;
    }

    const generated = await generateCaptions({
      brief: {
        niche: idea.brief.niche,
        tone: idea.brief.tone,
        audience: idea.brief.audience,
        goals: idea.brief.goals,
        competitors: idea.brief.competitors,
        keywords: idea.brief.keywords,
      },
      topic: payload.topic,
    });

    const rows = [
      { platform: 'tiktok', caption: generated.tiktok.caption, hashtags: generated.tiktok.hashtags },
      {
        platform: 'instagram',
        caption: generated.instagram.caption,
        hashtags: generated.instagram.hashtags,
      },
      { platform: 'youtube', caption: generated.youtube.caption, hashtags: generated.youtube.hashtags },
    ];

    await Caption.destroy({ where: { ideaId: idea.id } });
    await Caption.bulkCreate(rows.map((row) => ({ ...row, ideaId: idea.id })));

    const response = {
      tiktok: `${generated.tiktok.caption}\n\n${generated.tiktok.hashtags.map((tag) => `#${tag}`).join(' ')}`,
      instagram: `${generated.instagram.caption}\n\n${generated.instagram.hashtags
        .map((tag) => `#${tag}`)
        .join(' ')}`,
      youtube: `${generated.youtube.caption}\n\n${generated.youtube.hashtags.map((tag) => `#${tag}`).join(' ')}`,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

router.post('/analytics/analyze', async (req, res, next) => {
  try {
    const payload = z
      .object({
        briefId: z.string().uuid(),
        metricsInput: z.string().min(1),
      })
      .parse(req.body);

    const brief = await Brief.findByPk(payload.briefId);
    if (!brief) {
      res.status(404).json({ success: false, error: 'Brief not found' });
      return;
    }

    const analysis = await generateAnalytics({
      brief: {
        niche: brief.niche,
        tone: brief.tone,
        audience: brief.audience,
        goals: brief.goals,
        competitors: brief.competitors,
        keywords: brief.keywords,
      },
      metricsInput: payload.metricsInput,
    });

    await Analytics.create({
      briefId: brief.id,
      metricsInput: payload.metricsInput,
      aiAnalysis: analysis,
    });

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

export default router;
