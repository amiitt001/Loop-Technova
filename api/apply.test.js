
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './apply.js';
import admin from 'firebase-admin';
import dns from 'dns';

// Mock global fetch for EmailJS
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('OK')
}));

// Mock firebase-admin
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockGet = vi.fn();

vi.mock('firebase-admin', () => {
    return {
        default: {
            apps: ['app'], // Prevent re-initialization
            initializeApp: vi.fn(),
            credential: {
                cert: vi.fn(),
            },
            firestore: vi.fn(() => ({
                collection: vi.fn(() => ({
                    where: mockWhere,
                    add: mockAdd
                })),
            })),
        },
    };
});
// Need to mock FieldValue separately because it's accessed as admin.firestore.FieldValue
admin.firestore.FieldValue = {
    serverTimestamp: vi.fn(() => 'TIMESTAMP')
};


// Mock DNS
vi.mock('dns', () => ({
    default: {
        resolveMx: (domain, cb) => cb(null, [{ exchange: 'mail.example.com', priority: 10 }])
    }
}));


describe('api/apply.js', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default Mock Behavior for Firestore
        mockWhere.mockReturnValue({
            get: mockGet
        });
        mockGet.mockResolvedValue({
            empty: true // No duplicates by default
        });
        mockAdd.mockResolvedValue({ id: 'new-doc-id' });

        req = {
            method: 'POST',
            body: {
                name: 'John Doe',
                admissionNumber: '12345',
                email: 'john.doe@college.edu',
                domain: 'Full Stack Development',
                reason: 'I want to learn.',
                branch: 'CSE',
                year: '1st Year',
                college: 'Galgotias College',
                github: 'https://github.com/john',
                linkedin: 'https://linkedin.com/in/john'
            }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            setHeader: vi.fn()
        };
    });

    it('should accept valid application', async () => {
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockAdd).toHaveBeenCalled();
    });

    it('should reject non-POST requests', async () => {
        req.method = 'GET';
        await handler(req, res);
        // safeHandler wraps error and sends json
        expect(res.status).toHaveBeenCalledWith(400); // ValidationError is 400
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Method Not Allowed' }));
    });

    it('should reject missing required fields', async () => {
        delete req.body.email;
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Missing required fields' }));
    });

    it('should reject invalid email', async () => {
        req.body.email = 'invalid-email';
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid email') }));
    });

    it('should reject duplicate email', async () => {
        mockGet.mockResolvedValue({ empty: false }); // Duplicate exists
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(409); // ConflictError
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already exists') }));
    });

    // SECURITY TESTS

    it('should reject excessive input length for reason', async () => {
        req.body.reason = 'a'.repeat(2000); // Limit should be 1000
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('exceeds maximum length') }));
    });

    it('should reject non-string inputs', async () => {
        req.body.name = { malicious: true };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('must be a string') }));
    });
});
