import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  getCurrentUser,
  requireAuth,
  requireRole,
  setAuthCookie,
  clearAuthCookie,
} from '@/lib/auth';

// ─── Mock next/headers cookies ───────────────────────────────────────────────

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

// ─── hashPassword ────────────────────────────────────────────────────────────

describe('hashPassword', () => {
  it('should return a hashed password', async () => {
    const hash = await hashPassword('password123');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('password123');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should generate different hashes for the same password', async () => {
    const hash1 = await hashPassword('password123');
    const hash2 = await hashPassword('password123');
    expect(hash1).not.toBe(hash2); // bcrypt uses random salt
  });
});

// ─── comparePassword ─────────────────────────────────────────────────────────

describe('comparePassword', () => {
  it('should return true for matching password', async () => {
    const hash = await hashPassword('password123');
    const result = await comparePassword('password123', hash);
    expect(result).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const hash = await hashPassword('password123');
    const result = await comparePassword('wrongpassword', hash);
    expect(result).toBe(false);
  });
});

// ─── signToken ───────────────────────────────────────────────────────────────

describe('signToken', () => {
  it('should return a JWT string', () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });
});

// ─── verifyToken ─────────────────────────────────────────────────────────────

describe('verifyToken', () => {
  it('should return payload for a valid token', () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    const result = verifyToken(token);
    expect(result).toMatchObject(payload);
    expect(result).toHaveProperty('exp');
    expect(result).toHaveProperty('iat');
  });

  it('should return null for an invalid token', () => {
    const result = verifyToken('invalid-token-string');
    expect(result).toBeNull();
  });

  it('should return null for an empty token', () => {
    const result = verifyToken('');
    expect(result).toBeNull();
  });

  it('should return null for a tampered token', () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    const tampered = token.slice(0, -5) + 'xxxxx';
    const result = verifyToken(tampered);
    expect(result).toBeNull();
  });
});

// ─── getCurrentUser ──────────────────────────────────────────────────────────

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when no jwt cookie exists', async () => {
    mockCookies.get.mockReturnValue(undefined);
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('should return user payload when jwt cookie exists', async () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    mockCookies.get.mockReturnValue({ value: token });
    const result = await getCurrentUser();
    expect(result).toMatchObject(payload);
  });

  it('should return null when jwt cookie has invalid token', async () => {
    mockCookies.get.mockReturnValue({ value: 'invalid-token' });
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });
});

// ─── requireAuth ─────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when no user is authenticated', async () => {
    mockCookies.get.mockReturnValue(undefined);
    await expect(requireAuth()).rejects.toThrow('No autenticado');
  });

  it('should return user payload when authenticated', async () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    mockCookies.get.mockReturnValue({ value: token });
    const result = await requireAuth();
    expect(result).toMatchObject(payload);
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when user does not have required role', async () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    mockCookies.get.mockReturnValue({ value: token });
    await expect(requireRole('admin')).rejects.toThrow('Sin permisos');
  });

  it('should return user when role matches', async () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'csm' };
    const token = signToken(payload);
    mockCookies.get.mockReturnValue({ value: token });
    const result = await requireRole('csm');
    expect(result).toMatchObject(payload);
  });

  it('should return user when one of multiple roles matches', async () => {
    const payload = { id: 'user-1', email: 'test@frisol.com', name: 'Test User', role: 'po' };
    const token = signToken(payload);
    mockCookies.get.mockReturnValue({ value: token });
    const result = await requireRole('admin', 'po', 'dev');
    expect(result).toMatchObject(payload);
  });
});

// ─── setAuthCookie ───────────────────────────────────────────────────────────

describe('setAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set jwt cookie with correct options', async () => {
    const token = 'test-jwt-token';
    await setAuthCookie(token);
    expect(mockCookies.set).toHaveBeenCalledWith('jwt', token, {
      httpOnly: true,
      secure: false, // NODE_ENV is not 'production' in tests
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
  });
});

// ─── clearAuthCookie ─────────────────────────────────────────────────────────

describe('clearAuthCookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete jwt cookie', async () => {
    await clearAuthCookie();
    expect(mockCookies.delete).toHaveBeenCalledWith('jwt');
  });
});
