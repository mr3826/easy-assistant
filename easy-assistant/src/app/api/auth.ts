import type { Location, Membership, Organization, User } from '../types';
import { ApiError, apiRequest } from './client';

export interface AuthSession {
  user: User;
  memberships: Membership[];
  organization?: Organization | null;
  location?: Location | null;
  nextRoute?: '/dashboard';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  timezone: string;
}

interface LoginResponse {
  user: User;
  memberships: Membership[];
  organization?: Organization | null;
  location?: Location | null;
  nextRoute?: '/dashboard';
}

interface SignupResponse {
  user: User;
  organization: Organization;
  location: Location;
  membership: Membership;
  nextRoute?: '/dashboard';
}

function normalizeSession(response: LoginResponse): AuthSession {
  return {
    user: response.user,
    memberships: response.memberships,
    organization: response.organization ?? null,
    location: response.location ?? null,
    nextRoute: response.nextRoute,
  };
}

function normalizeSignupSession(response: SignupResponse): AuthSession {
  return {
    user: response.user,
    memberships: [response.membership],
    organization: response.organization,
    location: response.location,
    nextRoute: response.nextRoute,
  };
}

function isMissingSessionError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404);
}

export async function fetchAuthSession(): Promise<AuthSession | null> {
  try {
    return (await apiRequest<AuthSession>('/api/auth/session', { method: 'GET' })) ?? null;
  } catch (error) {
    if (!isMissingSessionError(error)) {
      throw error;
    }
  }

  try {
    return (await apiRequest<AuthSession>('/api/auth/me', { method: 'GET' })) ?? null;
  } catch (error) {
    if (isMissingSessionError(error)) {
      return null;
    }
    throw error;
  }
}

export async function loginWithApi(input: LoginInput): Promise<AuthSession> {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: input,
  });

  return normalizeSession(response);
}

export async function signupWithApi(input: SignupInput): Promise<AuthSession> {
  const response = await apiRequest<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body: input,
  });

  return normalizeSignupSession(response);
}

export async function logoutWithApi(): Promise<void> {
  await apiRequest<Record<string, never>>('/api/auth/logout', {
    method: 'POST',
    body: {},
  });
}
