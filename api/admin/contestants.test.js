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

describe('Admin Contestants API', () => {
    let mockReq, mockRes, mockDoc, mockContestantRef, mockDb;

    beforeEach(() => {
        vi.clearAllMocks();

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

    describe('Authentication', () => {
        it('should reject requests without admin auth', async () => {
            verifyAdmin.mockRejectedValue(new Error('Unauthorized'));

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Unauthorized');
            expect(verifyAdmin).toHaveBeenCalledWith(mockReq);
        });

        it('should allow requests with valid admin auth', async () => {
            verifyAdmin.mockResolvedValue(true);
            mockReq.body = { name: 'Updated Name', platformHandle: 'updated', points: 150 };

            await handler(mockReq, mockRes);

            expect(verifyAdmin).toHaveBeenCalledWith(mockReq);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('PATCH - Update Contestant', () => {
        beforeEach(() => {
            verifyAdmin.mockResolvedValue(true);
            mockReq.method = 'PATCH';
        });

        it('should update contestant with valid data', async () => {
            mockReq.body = {
                name: 'Updated Name',
                platformHandle: 'updatedhandle',
                points: 250,
                contestName: 'New Contest'
            };

            await handler(mockReq, mockRes);

            expect(mockContestantRef.update).toHaveBeenCalledWith({
                name: 'Updated Name',
                platformHandle: 'updatedhandle',
                points: 250,
                contestName: 'New Contest'
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Contestant updated successfully' });
        });

        it('should reject update with missing name', async () => {
            mockReq.body = {
                platformHandle: 'handle',
                points: 100
            };

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Missing required fields');
        });

        it('should reject update with missing platformHandle', async () => {
            mockReq.body = {
                name: 'Test Name',
                points: 100
            };

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Missing required fields');
        });

        it('should reject update with negative points', async () => {
            mockReq.body = {
                name: 'Test Name',
                platformHandle: 'handle',
                points: -50
            };

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Points must be a non-negative number');
        });

        it('should reject update with invalid points (NaN)', async () => {
            mockReq.body = {
                name: 'Test Name',
                platformHandle: 'handle',
                points: 'invalid'
            };

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Points must be a non-negative number');
        });

        it('should handle missing contestant ID', async () => {
            mockReq.query = {};

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Missing Contestant ID');
        });

        it('should handle non-existent contestant', async () => {
            mockDoc.exists = false;

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Contestant not found');
        });

        it('should update without optional contestName', async () => {
            mockReq.body = {
                name: 'Test Name',
                platformHandle: 'handle',
                points: 100
            };

            await handler(mockReq, mockRes);

            expect(mockContestantRef.update).toHaveBeenCalledWith({
                name: 'Test Name',
                platformHandle: 'handle',
                points: 100
            });
        });
    });

    describe('DELETE - Delete Contestant', () => {
        beforeEach(() => {
            verifyAdmin.mockResolvedValue(true);
            mockReq.method = 'DELETE';
        });

        it('should delete contestant with valid ID', async () => {
            await handler(mockReq, mockRes);

            expect(mockContestantRef.delete).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Contestant deleted successfully' });
        });

        it('should handle missing contestant ID', async () => {
            mockReq.query = {};

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Missing Contestant ID');
        });

        it('should handle non-existent contestant', async () => {
            mockDoc.exists = false;

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Contestant not found');
        });
    });

    describe('Method Not Allowed', () => {
        beforeEach(() => {
            verifyAdmin.mockResolvedValue(true);
        });

        it('should reject GET requests', async () => {
            mockReq.method = 'GET';

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Method Not Allowed');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', 'DELETE, PATCH');
        });

        it('should reject POST requests', async () => {
            mockReq.method = 'POST';

            await expect(handler(mockReq, mockRes)).rejects.toThrow('Method Not Allowed');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', 'DELETE, PATCH');
        });
    });
});
