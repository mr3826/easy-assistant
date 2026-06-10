import type { ApiResponse, Brief, CaptionsResult, Idea, Script, SessionState } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new Error(body.error ?? 'Unknown API error');
  }

  return body.data;
};

export const api = {
  getSession: () => request<SessionState>('/session'),
  updateSession: (payload: Partial<Pick<SessionState, 'activeBriefId' | 'checklist'>>) =>
    request<SessionState>('/session', { method: 'PUT', body: JSON.stringify(payload) }),
  setActiveBrief: (briefId: string | null) =>
    request<SessionState>('/session/brief', { method: 'POST', body: JSON.stringify({ briefId }) }),

  listBriefs: () => request<Brief[]>('/briefs'),
  getBrief: (id: string) => request<Brief>(`/briefs/${id}`),
  createBrief: (payload: Omit<Brief, 'id'>) =>
    request<Brief>('/briefs', { method: 'POST', body: JSON.stringify(payload) }),
  updateBrief: (id: string, payload: Omit<Brief, 'id'>) =>
    request<Brief>(`/briefs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  generateIdeas: (payload: { briefId: string; trendingTopic?: string }) =>
    request<Idea[]>('/ideation/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateScript: (payload: { ideaId: string; duration: string; style: string; notes?: string }) =>
    request<Script>('/scripts/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateCaptions: (payload: { ideaId: string; topic: string }) =>
    request<CaptionsResult>('/captions/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateAnalytics: (payload: { briefId: string; metricsInput: string }) =>
    request<string>('/analytics/analyze', { method: 'POST', body: JSON.stringify(payload) }),
};
