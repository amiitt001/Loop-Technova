
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './register.js';
import admin from 'firebase-admin';

// Mock global fetch for EmailJS and Google Sheets
global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('OK')
}));

// Mock firebase-admin
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockGet = vi.fn();
const mockDoc = vi.fn();

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
                    doc: mockDoc
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
        process.env.EMAILJS_CONFIRM_TEMPLATE_ID = 'template_test';
        process.env.EMAILJS_PUBLIC_KEY = 'public_test';
        process.env.GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/TEST/exec';

        // Default Mock Behavior for Firestore
        mockWhere.mockReturnValue({
            where: vi.fn().mockReturnThis(), // handle multiple wheres
            get: mockGet
        });
        mockGet.mockResolvedValue({
            empty: true // No duplicates by default
        });
        mockAdd.mockResolvedValue({ id: 'new-doc-id' });

        // Mock event document
        mockDoc.mockReturnValue({
            get: vi.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                    date: new Date(),
                    time: '10:00 AM',
                    location: 'Auditorium'
                })
            })
        });

        req = {
            method: 'POST',
            body: {
                eventId: 'event-123',
                eventTitle: 'Hackathon 2024',
                name: 'Jane Doe',
                email: 'jane.doe@college.edu',
                enrollmentId: '123456',
                department: 'CSE',
                teamName: 'Coders',
                responses: []
            }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            setHeader: vi.fn()
        };
    });

    it('should sanitize formula injection attempts in Google Sheets', async () => {
        // Malicious inputs
        req.body.name = '=HYPERLINK("http://evil.com")';
        req.body.teamName = '+12345';
        req.body.enrollmentId = '@cmd';

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Inspect the body passed to fetch
        // There should be 2 fetches: EmailJS and Google Sheets
        // We need to find the one for Google Sheets
        const fetchCall = global.fetch.mock.calls.find(call => call[0] === 'https://script.google.com/macros/s/TEST/exec');
        expect(fetchCall).toBeDefined();

        const body = fetchCall[1].body;
        // body is URLSearchParams object

        // EXPECT TO FAIL BEFORE FIX:
        expect(body.get('name')).toBe("'=HYPERLINK(\"http://evil.com\")");
        expect(body.get('teamName')).toBe("'+12345");
        expect(body.get('enrollmentId')).toBe("'@cmd");
    });
});
