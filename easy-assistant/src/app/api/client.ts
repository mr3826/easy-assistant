import { env } from '../../config/env';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function buildUrl(path: string) {
  return new URL(path, env.API_BASE_URL).toString();
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const candidate = data as Record<string, unknown>;
    const message = candidate.message ?? candidate.error ?? candidate.detail;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
  };

  if (body !== undefined) {
    init.body = body instanceof FormData || typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), init);
  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, `Request failed with status ${response.status}`), response.status, data);
  }

  return data as T;
}
