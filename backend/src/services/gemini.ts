import { env } from '../config/env';

type BriefInput = {
  niche: string;
  tone: string;
  audience: string;
  goals: string;
  competitors: string;
  keywords: string;
};

type IdeaItem = {
  num: number;
  hook: string;
  concept: string;
  format: string;
  duration: string;
  cta: string;
  score: number;
};

const ensureKey = () => {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to backend/.env');
  }
};

const apiUrlForModel = (model: string) => `https://generativelanguage.googleapis.com/v1/models/${model}:generate?key=${encodeURIComponent(
  env.geminiApiKey ?? '',
)} `;

const extractText = (resp: any): string => {
  // Try several response shapes used by Google Generative APIs
  if (!resp) return '';

  // new shape: candidates[].content[] -> { type: 'output_text', text }
  if (Array.isArray(resp.candidates) && resp.candidates.length > 0) {
    const candidate = resp.candidates[0];
    if (typeof candidate === 'string') return candidate;
    if (candidate.output) return String(candidate.output);
    if (Array.isArray(candidate.content)) {
      const textBlocks = candidate.content
        .map((c: any) => (typeof c === 'string' ? c : c.text ?? c.output_text ?? ''))
        .filter(Boolean);
      if (textBlocks.length) return textBlocks.join('\n').trim();
    }
    if (candidate.text) return String(candidate.text);
  }

  // older shape: output[0].content[0].text
  if (Array.isArray(resp.output) && resp.output.length > 0) {
    const block = resp.output[0];
    if (Array.isArray(block.content) && block.content.length > 0) {
      const first = block.content[0];
      if (first.text) return first.text;
    }
    if (block.text) return block.text;
  }

  // fallback attempt
  if (typeof resp === 'string') return resp;
  if (resp?.text) return resp.text;
  return JSON.stringify(resp);
};

const callGemini = async (prompt: string, opts?: { maxOutputTokens?: number; temperature?: number }) => {
  ensureKey();

  const model = env.geminiModel ?? 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generate?key=${encodeURIComponent(
    env.geminiApiKey ?? '',
  )}`;

  const body = {
    prompt: { text: prompt },
    temperature: typeof opts?.temperature === 'number' ? opts.temperature : 0.2,
    maxOutputTokens: opts?.maxOutputTokens ?? 1024,
  } as any;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json().catch(() => ({}));
  const text = extractText(data);
  return text;
};

const parseJsonFromText = <T>(text: string): T => {
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]) as T;
    }

    throw new Error('AI response JSON parsing failed.');
  }
};

export const generateIdeas = async (input: { brief: BriefInput; trendingTopic?: string }) => {
  const trendLine = input.trendingTopic ? `- Trending angle this week: ${input.trendingTopic}` : '';

  const prompt = `You are a short-form video content strategist. Generate exactly 6 short-form video concepts (TikTok/Instagram Reels/YouTube Shorts) for this brand.

Brand Brief:
- Niche: ${input.brief.niche}
- Tone: ${input.brief.tone}
- Audience: ${input.brief.audience}
- Goals: ${input.brief.goals}
- Keywords: ${input.brief.keywords}
- Competitors/Inspiration: ${input.brief.competitors}
${trendLine}

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "num": 1,
    "hook": "Opening hook line (max 12 words, very punchy)",
    "concept": "2-sentence concept description",
    "format": "e.g. Listicle / Story / Tutorial / Challenge / POV",
    "duration": "e.g. 30s / 45s / 60s",
    "cta": "Call to action",
    "score": 85
  }
]`;

  const resp = await callGemini(prompt, { maxOutputTokens: 1400, temperature: 0.0 });
  return parseJsonFromText<IdeaItem[]>(resp);
};

export const generateScript = async (input: {
  brief: BriefInput;
  hook: string;
  concept: string;
  cta: string;
  duration: string;
  style: string;
  notes?: string;
}) => {
  const prompt = `Write a complete short-form video script for the following:

Brand: ${input.brief.niche} | Tone: ${input.brief.tone} | Audience: ${input.brief.audience}
Idea hook: ${input.hook}
Concept: ${input.concept}
CTA: ${input.cta}
Duration: ${input.duration} | Style: ${input.style}
Extra: ${input.notes ?? ''}

Format the script EXACTLY like this (use plain text, no markdown):

[HOOK — 0-3s]
<the opening line / visual>

[BODY — 3-${input.duration}]
<main content broken into bullet points or scenes>

[CTA — last 3s]
<call to action>

[VISUAL NOTES]
<brief suggestions for B-roll, text overlays, transitions>

[VOICEOVER SCRIPT]
<clean read-aloud version for ElevenLabs, no stage directions>`;

  const resp = await callGemini(prompt, { maxOutputTokens: 1400, temperature: 0.2 });
  return resp;
};

export const generateCaptions = async (input: { brief: BriefInput; topic: string }) => {
  const prompt = `Write social media captions for this video. Return ONLY JSON, no markdown:
{
  "tiktok": {
    "caption": "120-word TikTok caption with storytelling hook, conversational, emoji-rich",
    "hashtags": ["tag1","tag2", "... up to 20 tags without #"]
  },
  "instagram": {
    "caption": "150-word Instagram caption, slightly more polished, line breaks for readability",
    "hashtags": ["tag1","tag2", "... up to 25 tags without #"]
  },
  "youtube": {
    "caption": "200-word YouTube Shorts description, keyword-rich for search, include CTA",
    "hashtags": ["tag1","tag2", "... up to 10 tags without #"]
  }
}

Brand: ${input.brief.niche} | Tone: ${input.brief.tone} | Audience: ${input.brief.audience}
Video topic: ${input.topic}
Goals: ${input.brief.goals}`;

  const resp = await callGemini(prompt, { maxOutputTokens: 1600, temperature: 0.2 });
  return parseJsonFromText<{
    tiktok: { caption: string; hashtags: string[] };
    instagram: { caption: string; hashtags: string[] };
    youtube: { caption: string; hashtags: string[] };
  }>(resp);
};

export const generateAnalytics = async (input: { brief: BriefInput; metricsInput: string }) => {
  const prompt = `You are a social media analytics expert. Analyse this performance data for a ${input.brief.niche} creator.

Data:
${input.metricsInput}

Provide:
1. TOP INSIGHT: What specifically made the best-performing video win?
2. WHAT TO DO MORE: 2-3 specific, actionable content directions to double down on
3. WHAT TO AVOID: 1-2 patterns in the underperformers
4. NEXT VIDEO BRIEF: A ready-to-use brief for the next video based on what worked
5. UPDATED HOOK ANGLE: A punchy new hook idea using the winning formula

Be specific, not generic. Reference the actual data.`;

  const resp = await callGemini(prompt, { maxOutputTokens: 1000, temperature: 0.2 });
  return resp;
};

export default {
  generateIdeas,
  generateScript,
  generateCaptions,
  generateAnalytics,
};
