import { vi } from 'vitest';
import type { AuthSession, LoginInput, SignupInput } from '../app/api';
import type { Location, Membership, Organization, User } from '../app/types';

export class MockApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const authApiState = {
  session: null as AuthSession | null,
  fetchSessionError: null as unknown,
  loginResponse: null as AuthSession | null,
  signupResponse: null as AuthSession | null,
  loginCalls: [] as LoginInput[],
  signupCalls: [] as SignupInput[],
  logoutCalls: 0,
};

export function resetAuthApiMock() {
  authApiState.session = null;
  authApiState.fetchSessionError = null;
  authApiState.loginResponse = null;
  authApiState.signupResponse = null;
  authApiState.loginCalls = [];
  authApiState.signupCalls = [];
  authApiState.logoutCalls = 0;
}

export function createAuthSession(overrides: Partial<AuthSession> = {}): AuthSession {
  const now = '2026-06-11T00:00:00+06:00';
  const user: User = {
    id: overrides.user?.id ?? 'user-1',
    name: overrides.user?.name ?? 'Owner',
    email: overrides.user?.email ?? 'owner@example.com',
    passwordHash: overrides.user?.passwordHash ?? 'dev:password123',
    status: overrides.user?.status ?? 'active',
    lastLoginAt: overrides.user?.lastLoginAt ?? null,
    createdAt: overrides.user?.createdAt ?? now,
    updatedAt: overrides.user?.updatedAt ?? now,
  };
  const organization: Organization = overrides.organization ?? {
    id: 'org-1',
    name: 'Owner Salon',
    slug: 'owner-salon',
    timezone: 'Asia/Dhaka',
    ownerUserId: user.id,
    createdAt: now,
    updatedAt: now,
  };
  const location: Location = overrides.location ?? {
    id: 'loc-1',
    organizationId: organization.id,
    name: 'Main Location',
    timezone: organization.timezone,
    addressLine1: null,
    addressLine2: null,
    city: null,
    region: null,
    country: null,
    phone: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const membership: Membership = overrides.memberships?.[0] ?? {
    id: 'membership-1',
    organizationId: organization.id,
    userId: user.id,
    role: 'owner',
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  return {
    user,
    memberships: overrides.memberships ?? [membership],
    organization,
    location,
    nextRoute: overrides.nextRoute ?? '/dashboard',
  };
}

async function fetchAuthSession() {
  if (authApiState.fetchSessionError) {
    throw authApiState.fetchSessionError;
  }

  return authApiState.session;
}

async function loginWithApi(input: LoginInput) {
  authApiState.loginCalls.push(input);
  const session = authApiState.loginResponse ?? authApiState.session ?? createAuthSession();
  authApiState.session = session;
  return session;
}

async function signupWithApi(input: SignupInput) {
  authApiState.signupCalls.push(input);
  const session = authApiState.signupResponse ?? authApiState.session ?? createAuthSession({
    user: {
      id: 'user-signup',
      name: input.name,
      email: input.email,
      passwordHash: `dev:${input.password}`,
      status: 'active',
      lastLoginAt: null,
      createdAt: '2026-06-11T00:00:00+06:00',
      updatedAt: '2026-06-11T00:00:00+06:00',
    },
    organization: {
      id: 'org-signup',
      name: input.organizationName,
      slug: 'owner-salon',
      timezone: input.timezone,
      ownerUserId: 'user-signup',
      createdAt: '2026-06-11T00:00:00+06:00',
      updatedAt: '2026-06-11T00:00:00+06:00',
    },
  });

  authApiState.session = session;
  return session;
}

async function logoutWithApi() {
  authApiState.logoutCalls += 1;
  authApiState.session = null;
}

vi.mock('../app/api', () => ({
  ApiError: MockApiError,
  fetchAuthSession,
  loginWithApi,
  logoutWithApi,
  signupWithApi,
}));
