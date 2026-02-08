import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './applications.js';

// Mock dependencies
global.fetch = vi.fn(() => Promise.resolve({ ok: true }));

const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();

vi.mock('firebase-admin', () => ({
    default: {
        apps: ['app'],
        initializeApp: vi.fn(),
        credential: { cert: vi.fn() },
        firestore: vi.fn(() => ({
            collection: vi.fn(() => ({
                doc: vi.fn(() => ({
                    get: mockGet,
                    delete: mockDelete,
                    update: mockUpdate
                }))
            }))
        }))
    }
}));

vi.mock('../_utils/auth.js', () => ({
    verifyAdmin: vi.fn(() => Promise.resolve({ uid: 'admin-123' }))
}));

vi.mock('../_utils/wrapper.js', () => ({
    safeHandler: (fn) => fn // Pass through
}));

describe('api/admin/applications.js', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GOOGLE_SHEET_URL = 'https://sheet.url/exec';

        req = {
            method: 'GET',
            query: { id: 'app-123' },
            body: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            setHeader: vi.fn()
        };

        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({ email: 'test@example.com' })
        });
    });

    it('should delete from Firestore and sync to Google Sheet', async () => {
        req.method = 'DELETE';

        await handler(req, res);

        expect(mockDelete).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);

        // Verify Sheet Call
        expect(global.fetch).toHaveBeenCalledWith(
            'https://sheet.url/exec',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(Object) // URLSearchParams
            })
        );
    });

    it('should update status in Firestore and sync to Google Sheet', async () => {
        req.method = 'PATCH';
        req.body.status = 'Approved';

        await handler(req, res);

        expect(mockUpdate).toHaveBeenCalledWith({ status: 'Approved' });
        expect(res.status).toHaveBeenCalledWith(200);

        // Verify Sheet Call
        expect(global.fetch).toHaveBeenCalledWith(
            'https://sheet.url/exec',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(Object)
            })
        );
    });

    it('should handle missing application ID', async () => {
        req.query.id = null;
        try {
            await handler(req, res);
        } catch (e) {
            expect(e.message).toBe('Missing Application ID');
        }
    });
});
