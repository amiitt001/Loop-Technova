
import admin from 'firebase-admin';

// prevent re-initialization ensuring singleton
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const db = admin.firestore();

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const BLOCKED_DOMAINS = ['example.com', 'test.com', 'dummy.com', 'mailinator.com', 'yopmail.com'];
const BLOCKED_PREFIXES = ['test', 'admin', 'user', 'no-reply', 'noreply'];
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function validateEmail(email) {
    if (!email || !EMAIL_REGEX.test(email)) return { valid: false, reason: 'Invalid email format' };

    const [local, domain] = email.split('@');

    if (BLOCKED_DOMAINS.includes(domain.toLowerCase())) return { valid: false, reason: 'Domain is blocked' };
    if (BLOCKED_PREFIXES.includes(local.toLowerCase())) return { valid: false, reason: 'Email prefix is blocked' };

    // Prevent self-send (system email)
    if (email === 'technova@galgotias.edu') return { valid: false, reason: 'Cannot use system email' };

    try {
        const addresses = await resolveMx(domain);
        if (!addresses || addresses.length === 0) return { valid: false, reason: 'No mail server found for domain' };
        return { valid: true };
    } catch (error) {
        return { valid: false, reason: 'Domain validation failed' };
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { name, email, domain, reason, branch, year, college, github } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {

        // 0. Strict Email Validation
        const emailValidation = await validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ error: `Invalid email: ${emailValidation.reason}` });
        }

        // 1. Check for duplicates (SERVER-SIDE VALIDATION)
        const appsRef = db.collection('applications');
        const snapshot = await appsRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            console.warn(`Duplicate application blocked for: ${email}`);
            return res.status(409).json({ error: 'Application with this email already exists.' });
        }

        // 2. Save to Firestore (Secure Write)
        const newApp = {
            name,
            email,
            domain,
            reason,
            branch,
            year,
            college,
            github,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending'
        };

        const docRef = await appsRef.add(newApp);

        // 3. Send Email via EmailJS (Server-side)
        if (process.env.EMAIL_TEST_MODE === 'true') {
            console.log(`[TEST MODE] Email would be sent to ${email} for application ${docRef.id}`);
            return res.status(200).json({ message: 'Application received (Test Mode)!' });
        }

        const serviceID = process.env.EMAILJS_SERVICE_ID;
        const templateID = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY;

        if (serviceID && templateID && publicKey) {
            const templateParams = {
                name,
                email,
                domain,
                reason,
                branch,
                year,
                college,
                github,
                reply_to: "technova@galgotias.edu"
            };

            const data = {
                service_id: serviceID,
                template_id: templateID,
                user_id: publicKey,
                template_params: templateParams
            };

            if (privateKey) data.accessToken = privateKey;

            try {
                const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!emailResponse.ok) {
                    console.error('EmailJS Error (Silent Fail):', await emailResponse.text());
                    // Silent failure: We do not return 500, because application IS saved.
                }
            } catch (err) {
                console.error('EmailJS Network Error (Silent Fail):', err);
            }
        }

        return res.status(200).json({ message: 'Application received successfully!' });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
