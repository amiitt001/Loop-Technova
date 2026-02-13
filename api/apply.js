
/* global process */
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

import { safeHandler } from './_utils/wrapper.js';
import { ValidationError, ConflictError } from './_utils/errors.js';
import { sanitizeForSheets } from './_utils/sanitizers.js';
import { validateEmail } from './_utils/validators.js';

function validateInput(data) {
    const rules = {
        name: { maxLength: 100 },
        admissionNumber: { maxLength: 20 },
        branch: { maxLength: 50 },
        year: { maxLength: 20 },
        college: { maxLength: 100 },
        reason: { maxLength: 1000 },
        domain: { maxLength: 50 },
        github: { maxLength: 200 },
        linkedin: { maxLength: 200 }
    };

    for (const [field, rule] of Object.entries(rules)) {
        if (data[field]) {
            if (typeof data[field] !== 'string') {
                return { valid: false, reason: `${field} must be a string` };
            }
            if (data[field].length > rule.maxLength) {
                return { valid: false, reason: `${field} exceeds maximum length of ${rule.maxLength}` };
            }
        }
    }
    return { valid: true };
}

export default safeHandler(async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new ValidationError('Method Not Allowed'); // Technically 405, but simplified for now
    }

    const { name, admissionNumber, email, domain, reason, branch, year, college, github, linkedin } = req.body;

    if (!email || !name || !admissionNumber) {
        throw new ValidationError('Missing required fields');
    }

    // 0. Input Validation
    const inputValidation = validateInput(req.body);
    if (!inputValidation.valid) {
        throw new ValidationError(`Invalid input: ${inputValidation.reason}`);
    }

    // 0.1 Strict Email Validation
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
        throw new ValidationError(`Invalid email: ${emailValidation.reason}`);
    }

    // 1. Check for duplicates (SERVER-SIDE VALIDATION)
    const appsRef = db.collection('applications');
    const snapshot = await appsRef.where('email', '==', email).get();

    if (!snapshot.empty) {
        throw new ConflictError('Application with this email already exists.');
    }

    // 2. Save to Firestore (Secure Write)
    const newApp = {
        name,
        admissionNumber,
        email,
        domain,
        reason,
        branch,
        year,
        college,
        github,
        linkedin,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending'
    };

    const docRef = await appsRef.add(newApp);

    // 3. Send Email via EmailJS (Graceful Degradation)
    // We wrap this in a localized try/catch because email failure
    // should NOT revert the successful application submission.
    try {
        if (process.env.EMAIL_TEST_MODE === 'true') {
            console.log(`[TEST MODE] Email would be sent to ${email} for application ${docRef.id}`);
            res.status(200).json({ message: 'Application received (Test Mode)!' });
            return;
        }

        const serviceID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
        const templateID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY;

        // Security Warning: Check if the private key is exposed via VITE_ env var
        if (process.env.VITE_EMAILJS_PRIVATE_KEY) {
            console.warn("🚨 SECURITY WARNING: VITE_EMAILJS_PRIVATE_KEY is defined! This exposes your private key to the client. Please rename it to EMAILJS_PRIVATE_KEY and remove the VITE_ prefix.");
        }

        if (serviceID && templateID && publicKey) {
            console.log("EmailJS Params Present: ServiceID, TemplateID, PublicKey");

            const templateParams = {
                to_name: "Admin",
                name,
                admissionNumber,
                email,
                domain,
                reason,
                branch,
                year,
                college,
                github,
                linkedin,
                message: `New Application from ${name} (Admission No: ${admissionNumber}, ${branch}, ${year})`,
                reply_to: "technova@galgotias.edu"
            };

            const data = {
                service_id: serviceID,
                template_id: templateID,
                user_id: publicKey,
                template_params: templateParams
            };

            if (privateKey) data.accessToken = privateKey;

            const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!emailResponse.ok) {
                console.error('EmailJS Error (Silent Fail):', await emailResponse.text());
            } else {
                console.log('EmailJS Success: Email sent to', email);
            }
        } else {
            console.warn("EmailJS Configuration Missing - Skipping Email Notification");
        }
    } catch (emailError) {
        // Critical: Do NOT throw here. Just log it.
        console.error("Email subsystem failed gracefully:", emailError);
    }

    // 3.5. Submit to Google Sheets (Hidden from Client)
    try {
        const sheetURL = process.env.GOOGLE_SHEET_URL || process.env.VITE_GOOGLE_SHEET_URL;
        if (sheetURL) {
            const formParams = new URLSearchParams();
            formParams.append('name', sanitizeForSheets(name));
            formParams.append('admissionNumber', sanitizeForSheets(admissionNumber));
            formParams.append('email', email); // Validated to be safe
            formParams.append('branch', sanitizeForSheets(branch));
            formParams.append('year', sanitizeForSheets(year));
            formParams.append('college', sanitizeForSheets(college));
            formParams.append('domain', sanitizeForSheets(domain));
            formParams.append('github', sanitizeForSheets(github || ''));
            formParams.append('linkedin', sanitizeForSheets(linkedin || ''));
            formParams.append('reason', sanitizeForSheets(reason));
            formParams.append('status', 'Pending');

            const sheetResponse = await fetch(sheetURL, {
                method: 'POST',
                body: formParams,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (!sheetResponse.ok) {
                console.error('Google Sheet Error:', await sheetResponse.text());
            } else {
                console.log('Google Sheet Submission Success');
            }
        } else {
            console.warn('Google Sheet URL not configured (Skipping Sheet Submission)');
        }
    } catch (sheetError) {
        console.error('Google Sheet Submission Failed:', sheetError);
    }

    // 4. Return Success
    return res.status(200).json({ message: 'Application received successfully!' });
});
