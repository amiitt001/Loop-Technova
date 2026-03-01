import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './contestants.js';
import admin from 'firebase-admin';

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
    default: {
        firestore: vi.fn(),
        auth: vi.fn()
    }
}));

// Mock utilities
vi.mock('../_utils/wrapper.js', () => ({
    safeHandler: (fn) => fn
}));

vi.mock('../_utils/auth.js', () => ({
    verifyAdmin: vi.fn()
}));

import { verifyAdmin } from '../_utils/auth.js';

describe('Admin Contestants API - Validation', () => {
    let mockReq, mockRes, mockDoc, mockContestantRef, mockDb;

    beforeEach(() => {
        vi.clearAllMocks();
        verifyAdmin.mockResolvedValue(true);

        mockDoc = {
            exists: true,
            data: vi.fn(() => ({
                name: 'Test User',
                platformHandle: 'testuser',
                points: 100,
                contestName: 'Test Contest'
            }))
        };

        mockContestantRef = {
            get: vi.fn(() => Promise.resolve(mockDoc)),
            update: vi.fn(() => Promise.resolve()),
            delete: vi.fn(() => Promise.resolve())
        };

        mockDb = {
            collection: vi.fn(() => ({
                doc: vi.fn(() => mockContestantRef)
            }))
        };

        admin.firestore.mockReturnValue(mockDb);

        mockReq = {
            query: { id: 'contestant123' },
            body: {},
            method: 'PATCH'
        };

        mockRes = {
            status: vi.fn(() => mockRes),
            json: vi.fn(() => mockRes),
            setHeader: vi.fn()
        };
    });

    it('should reject non-string name', async () => {
        mockReq.body = {
            name: 12345, // Invalid type
            platformHandle: 'valid',
            points: 10
        };
        await expect(handler(mockReq, mockRes)).rejects.toThrow('name must be a string');
    });

    it('should reject overly long name', async () => {
        mockReq.body = {
            name: 'a'.repeat(101), // Too long
            platformHandle: 'valid',
            points: 10
        };
        await expect(handler(mockReq, mockRes)).rejects.toThrow('name exceeds maximum length');
    });

    it('should reject non-string platformHandle', async () => {
        mockReq.body = {
            name: 'Valid Name',
            platformHandle: ['invalid'], // Invalid type
            points: 10
        };
        await expect(handler(mockReq, mockRes)).rejects.toThrow('platformHandle must be a string');
    });

    it('should reject overly long platformHandle', async () => {
        mockReq.body = {
            name: 'Valid Name',
            platformHandle: 'a'.repeat(51), // Too long (assuming 50 limit)
            points: 10
        };
        await expect(handler(mockReq, mockRes)).rejects.toThrow('platformHandle exceeds maximum length');
    });

    it('should reject non-string contestName', async () => {
        mockReq.body = {
            name: 'Valid Name',
            platformHandle: 'valid',
            points: 10,
            contestName: { invalid: true } // Invalid type
        };
        await expect(handler(mockReq, mockRes)).rejects.toThrow('contestName must be a string');
    });

    it('should reject overly long contestName', async () => {
        mockReq.body = {
            name: 'Valid Name',
            platformHandle: 'valid',
            points: 10,
            contestName: 'a'.repeat(101) // Too long
        };
        await expect(handler(mockReq, mockRes)).rejects.toThrow('contestName exceeds maximum length');
    });

    it('should reject non-string ID', async () => {
        mockReq.query.id = ['array', 'id'];
        await expect(handler(mockReq, mockRes)).rejects.toThrow('Contestant ID must be a string');
    });
});
