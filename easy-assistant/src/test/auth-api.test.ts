import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchAuthSession, loginWithApi, logoutWithApi, signupWithApi } from '../app/api';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('auth api helpers', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('logs in through the api client and normalizes the auth session', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        user: {
          id: 'user-1',
          name: 'Owner',
          email: 'owner@example.com',
          passwordHash: 'dev:password123',
          status: 'active',
          lastLoginAt: '2026-06-11T00:15:00+06:00',
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:15:00+06:00',
        },
        memberships: [
          {
            id: 'membership-1',
            organizationId: 'org-1',
            userId: 'user-1',
            role: 'owner',
            active: true,
            createdAt: '2026-06-11T00:00:00+06:00',
            updatedAt: '2026-06-11T00:15:00+06:00',
          },
        ],
        organization: {
          id: 'org-1',
          name: 'Owner Salon',
          slug: 'owner-salon',
          timezone: 'Asia/Dhaka',
          ownerUserId: 'user-1',
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:15:00+06:00',
        },
        location: {
          id: 'loc-1',
          organizationId: 'org-1',
          name: 'Main Location',
          timezone: 'Asia/Dhaka',
          addressLine1: null,
          addressLine2: null,
          city: null,
          region: null,
          country: null,
          phone: null,
          active: true,
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:15:00+06:00',
        },
        nextRoute: '/dashboard',
      }),
    );

    const session = await loginWithApi({ email: 'owner@example.com', password: 'password123' });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'owner@example.com', password: 'password123' }),
    });
    expect(session.user.email).toBe('owner@example.com');
    expect(session.memberships).toHaveLength(1);
    expect(session.organization?.slug).toBe('owner-salon');
  });

  it('falls back from /session to /me when the session endpoint is unavailable', async () => {
    const responseSession = {
      user: {
        id: 'user-1',
        name: 'Owner',
        email: 'owner@example.com',
        passwordHash: 'dev:password123',
        status: 'active',
        lastLoginAt: '2026-06-11T00:15:00+06:00',
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:15:00+06:00',
      },
      memberships: [],
      organization: null,
      location: null,
      nextRoute: '/dashboard',
    };

    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: 'Missing session' }));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, responseSession));

    const session = await fetchAuthSession();

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(session?.user.email).toBe('owner@example.com');
  });

  it('signs up and logs out through the api client', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        user: {
          id: 'user-signup',
          name: 'New Owner',
          email: 'new-owner@example.com',
          passwordHash: 'dev:password123',
          status: 'active',
          lastLoginAt: null,
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:00:00+06:00',
        },
        organization: {
          id: 'org-signup',
          name: 'New Salon',
          slug: 'new-salon',
          timezone: 'Asia/Dhaka',
          ownerUserId: 'user-signup',
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:00:00+06:00',
        },
        location: {
          id: 'loc-signup',
          organizationId: 'org-signup',
          name: 'Main Location',
          timezone: 'Asia/Dhaka',
          addressLine1: null,
          addressLine2: null,
          city: null,
          region: null,
          country: null,
          phone: null,
          active: true,
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:00:00+06:00',
        },
        membership: {
          id: 'membership-signup',
          organizationId: 'org-signup',
          userId: 'user-signup',
          role: 'owner',
          active: true,
          createdAt: '2026-06-11T00:00:00+06:00',
          updatedAt: '2026-06-11T00:00:00+06:00',
        },
        nextRoute: '/dashboard',
      }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const signupSession = await signupWithApi({
      name: 'New Owner',
      email: 'new-owner@example.com',
      password: 'password123',
      organizationName: 'New Salon',
      timezone: 'Asia/Dhaka',
    });
    await logoutWithApi();

    expect(signupSession.memberships).toHaveLength(1);
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Owner',
        email: 'new-owner@example.com',
        password: 'password123',
        organizationName: 'New Salon',
        timezone: 'Asia/Dhaka',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
  });

  it('throws a typed api error for non-auth responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { error: 'Boom' }));

    await expect(fetchAuthSession()).rejects.toBeInstanceOf(ApiError);
  });
});
