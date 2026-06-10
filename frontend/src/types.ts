export type Brief = {
  id?: string;
  niche: string;
  tone: string;
  audience: string;
  goals: string;
  schedule: string;
  competitors: string;
  keywords: string;
};

export type Idea = {
  id: string;
  briefId: string;
  num: number;
  hook: string;
  concept: string;
  format: string;
  duration: string;
  cta: string;
  score: number;
};

export type Script = {
  id: string;
  ideaId: string;
  duration: string;
  style: string;
  content: string;
};

export type SessionState = {
  id: string;
  activeBriefId: string | null;
  checklist: boolean[];
};

export type CaptionsResult = {
  tiktok: string;
  instagram: string;
  youtube: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};
