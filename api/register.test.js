
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './register.js';
import admin from 'firebase-admin';

// Mock DNS for email validation
vi.mock('dns', () => ({
    default: {
        resolveMx: (domain, cb) => cb(null, [{ exchange: 'mail.example.com', priority: 10 }])
    }
}));

// Mock global fetch for EmailJS and Google Sheets
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('OK')
}));

// Mock firebase-admin
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockGet = vi.fn();
const mockDocGet = vi.fn();

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
                    add: mockAdd,
                    doc: vi.fn(() => ({
                        get: mockDocGet
                    }))
                })),
            })),
        },
    };
});
// Need to mock FieldValue separately because it's accessed as admin.firestore.FieldValue
admin.firestore.FieldValue = {
    serverTimestamp: vi.fn(() => 'TIMESTAMP')
};

describe('api/register.js', () => {
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
            where: mockWhere, // Support chaining .where()
            get: mockGet
        });
        mockGet.mockResolvedValue({
            empty: true // No duplicates by default
        });
        mockAdd.mockResolvedValue({ id: 'new-doc-id' });

        // Mock Event Doc
        mockDocGet.mockResolvedValue({
            exists: true,
            data: () => ({
                date: new Date(),
                time: '10:00 AM',
                location: 'Main Hall'
            })
        });

        req = {
            method: 'POST',
            body: {
                eventId: 'evt123',
                eventTitle: 'Hackathon',
                name: 'Jane Doe',
                email: 'jane.doe@college.edu',
                enrollmentId: 'EN123',
                department: 'CSE',
                teamName: 'Coders',
                responses: [
                    { question: 'Mobile Number', answer: '1234567890' },
                    { question: 'Year', answer: '2nd Year' }
                ]
            }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            setHeader: vi.fn()
        };
    });

    it('should accept valid registration and submit to Google Sheets', async () => {
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
        expect(res.status).toHaveBeenCalledWith(400); // ValidationError is 400
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Method Not Allowed' }));
    });

    it('should reject missing required fields', async () => {
        delete req.body.email;
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing required fields') }));
    });

    it('should reject duplicate registration', async () => {
        mockGet.mockResolvedValue({ empty: false }); // Duplicate exists
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(409); // ConflictError
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already registered') }));
    });

    it('should reject invalid eventId', async () => {
        mockDocGet.mockResolvedValue({ exists: false }); // Event does not exist
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400); // ValidationError
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid Event ID' }));
    });

    // SECURITY TESTS

    it('should reject invalid responses (too long)', async () => {
        req.body.responses = Array(51).fill({ question: 'q', answer: 'a' });
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Too many responses') }));
    });

    it('should reject invalid responses (answer too long)', async () => {
        req.body.responses = [{ question: 'q', answer: 'a'.repeat(5001) }];
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Answer too long') }));
    });

    it('should sanitize formula injection attempts in Google Sheets', async () => {
        req.body.name = '=HYPERLINK("http://evil.com")';
        req.body.teamName = '+MaliciousTeam';
        req.body.eventTitle = '=cmd| /C calc';

        req.body.responses = [
            { question: 'Mobile Number', answer: '=1+1' },
            { question: 'Year', answer: '@cmd' }
        ];

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Inspect the body passed to fetch
        const fetchCall = global.fetch.mock.calls.find(call => call[0] === 'https://script.google.com/macros/s/TEST/exec');
        const body = fetchCall[1].body;
        // body is URLSearchParams object

        // These should be sanitized (prepended with ')
        expect(body.get('name')).toBe("'=HYPERLINK(\"http://evil.com\")");
        expect(body.get('teamName')).toBe("'+MaliciousTeam");
        expect(body.get('eventTitle')).toBe("'=cmd| /C calc");
        expect(body.get('mobile')).toBe("'=1+1");
        expect(body.get('year')).toBe("'@cmd");
    });
});
