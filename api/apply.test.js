
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

        // Setup Env Vars for Test
        process.env.EMAILJS_SERVICE_ID = 'service_test';
        process.env.EMAILJS_TEMPLATE_ID = 'template_test';
        process.env.EMAILJS_PUBLIC_KEY = 'public_test';
        process.env.GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/TEST/exec';
        process.env.EMAIL_TEST_MODE = 'false';

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

    it('should accept valid application and submit to Google Sheets', async () => {
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockAdd).toHaveBeenCalled();

        // Check fetches (1 for EmailJS, 1 for Google Sheets)
        expect(global.fetch).toHaveBeenCalledTimes(2);

        // Verify Google Sheets call
        expect(global.fetch).toHaveBeenCalledWith(
            'https://script.google.com/macros/s/TEST/exec',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        );
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

    it('should reject email starting with +', async () => {
        req.body.email = '+malicious@example.com';
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid email') }));
    });

    it('should sanitize formula injection attempts in Google Sheets', async () => {
        req.body.name = '=HYPERLINK("http://evil.com")';
        req.body.reason = '+12345';

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Inspect the body passed to fetch
        const fetchCall = global.fetch.mock.calls.find(call => call[0] === 'https://script.google.com/macros/s/TEST/exec');
        const body = fetchCall[1].body;
        // body is URLSearchParams object
        expect(body.get('name')).toBe("'=HYPERLINK(\"http://evil.com\")");
        expect(body.get('reason')).toBe("'+12345");
    });

    it('should reject excessive input length for email', async () => {
        req.body.email = 'a'.repeat(200) + '@gmail.com'; // Total > 100
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('exceeds maximum length') }));
    });
});
