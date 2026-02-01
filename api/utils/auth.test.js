
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAdmin } from './auth.js';
import { UnauthorizedError, ForbiddenError } from './errors.js';
import admin from 'firebase-admin';

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    default: {
      apps: ['app'], // Prevent re-initialization
      initializeApp: vi.fn(),
      credential: {
        cert: vi.fn(),
      },
      auth: vi.fn().mockReturnValue({
        verifyIdToken: vi.fn(),
      }),
    },
  };
});

describe('verifyAdmin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw UnauthorizedError if Authorization header is missing', async () => {
        const req = { headers: {} };
        await expect(verifyAdmin(req)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if token is invalid', async () => {
        const req = { headers: { authorization: 'Bearer invalid-token' } };
        admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));
        await expect(verifyAdmin(req)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError if user is not admin', async () => {
        const req = { headers: { authorization: 'Bearer user-token' } };
        // This simulates a normal user (no admin claim)
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@example.com' });

        // This expectation fails if the vulnerability exists (because it won't throw)
        await expect(verifyAdmin(req)).rejects.toThrow(ForbiddenError);
    });

    it('should return decoded token if user is admin', async () => {
        const req = { headers: { authorization: 'Bearer admin-token' } };
        const adminToken = { uid: 'admin123', email: 'admin@example.com', admin: true };
        admin.auth().verifyIdToken.mockResolvedValue(adminToken);

        const result = await verifyAdmin(req);
        expect(result).toEqual(adminToken);
    });
});
