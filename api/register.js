/* global process */
import admin from 'firebase-admin';
import { safeHandler } from './_utils/wrapper.js';
import { ValidationError, ConflictError } from './_utils/errors.js';
import { sanitizeForSheets } from './_utils/sanitizers.js';
import { validateEmail, validateResponses } from './_utils/validators.js';

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

function validateInput(data) {
    if (!data.eventId || !data.name || !data.email) {
        return { valid: false, reason: 'Missing required fields (eventId, name, email)' };
    }

    if (typeof data.eventId !== 'string' || data.eventId.length === 0) {
        return { valid: false, reason: 'Invalid eventId' };
    }

    // Max length validation to prevent DoS/Storage Exhaustion
    const MAX_LENGTHS = {
        name: 100,
        email: 100,
        eventTitle: 200,
        enrollmentId: 50,
        department: 100,
        teamName: 100
    };

    for (const [key, max] of Object.entries(MAX_LENGTHS)) {
        if (data[key] && typeof data[key] === 'string' && data[key].length > max) {
            return { valid: false, reason: `${key} exceeds maximum length of ${max}` };
        }
    }

    // Validate Responses
    if (data.responses) {
        const responseValidation = validateResponses(data.responses);
        if (!responseValidation.valid) {
            return responseValidation;
        }
    }

    return { valid: true };
}

export default safeHandler(async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new ValidationError('Method Not Allowed');
    }

    const { eventId, eventTitle, name, email, enrollmentId, department, teamName, responses } = req.body;

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
    const registrationsRef = db.collection('registrations');

    // Query registrations where eventId == eventId AND email == email
    const snapshot = await registrationsRef
        .where('eventId', '==', eventId)
        .where('email', '==', email)
        .get();

    if (!snapshot.empty) {
        throw new ConflictError('You have already registered for this event with this email.');
    }

    // 2. Save to Firestore (Secure Write)
    const newRegistration = {
        eventId,
        eventTitle: eventTitle || 'Unknown Event',
        name,
        email,
        enrollmentId: enrollmentId || 'N/A',
        department: department || 'N/A',
        teamName: teamName || '',
        responses: responses || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Registered' // Default status
    };

    const docRef = await registrationsRef.add(newRegistration);

    // 3. Parallel Execution of External Services (Fast & Reliable)
    // We define them as promises but do not await them yet.

    // --- EmailJS Promise ---
    const emailPromise = (async () => {
        try {
            const serviceID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
            const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
            const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY;

            if (serviceID && publicKey) {
                const confirmTemplateID = process.env.EMAILJS_CONFIRM_TEMPLATE_ID || process.env.VITE_EMAILJS_CONFIRM_TEMPLATE_ID || "template_mzmcp88";

                if (confirmTemplateID) {
                    let eventDetails = { date: 'TBA', time: 'TBA', venue: 'TBA' };

                    try {
                        const eventDoc = await db.collection('events').doc(eventId).get();
                        if (eventDoc.exists) {
                            const evt = eventDoc.data();
                            eventDetails.date = evt.date ? (evt.date.toDate ? evt.date.toDate().toDateString() : new Date(evt.date).toDateString()) : 'TBA';
                            eventDetails.time = evt.time || 'TBA';
                            eventDetails.venue = evt.location || evt.venue || 'TBA';
                        }
                    } catch (fetchErr) {
                        console.error("Failed to fetch event details for email:", fetchErr);
                    }

                    const userParams = {
                        name: name,
                        to_name: name,
                        email: email,
                        eventName: eventTitle,
                        eventDate: eventDetails.date,
                        eventTime: eventDetails.time,
                        eventVenue: eventDetails.venue,
                        reply_to: "loop.gcetclub@gmail.com"
                    };

                    const userData = {
                        service_id: serviceID,
                        template_id: confirmTemplateID,
                        user_id: publicKey,
                        template_params: userParams
                    };

                    if (privateKey) userData.accessToken = privateKey;

                    const userEmailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData),
                    });

                    if (!userEmailResponse.ok) {
                        console.error('User Confirmation Email Failed:', await userEmailResponse.text());
                        throw new Error('EmailJS responded with error');
                    } else {
                        console.log('User Confirmation Email Sent');
                    }
                }
            }
        } catch (emailError) {
            console.error("Email subsystem failed:", emailError);
            throw emailError; // Re-throw to be caught by allSettled
        }
    })();

    // --- Google Sheets Promise ---
    const sheetPromise = (async () => {
        try {
            const sheetURL = process.env.GOOGLE_SHEET_URL || process.env.VITE_GOOGLE_SHEET_URL;
            if (sheetURL) {
                const getResponse = (labelPart) => {
                    if (!responses) return '';
                    const found = responses.find(r => r.question.toLowerCase().includes(labelPart.toLowerCase()));
                    return found ? found.answer : '';
                };

                const mobile = getResponse('mobile') || getResponse('phone') || getResponse('contact');
                const year = getResponse('year');
                const branch = getResponse('branch') || department;

                const formParams = new URLSearchParams();
                formParams.append('action', 'register');
                formParams.append('eventTitle', eventTitle);
                formParams.append('eventId', eventId);

                // Secure: Sanitize inputs to prevent Formula Injection
                formParams.append('name', sanitizeForSheets(name));
                formParams.append('email', sanitizeForSheets(email));
                formParams.append('mobile', sanitizeForSheets(mobile));
                formParams.append('year', sanitizeForSheets(year));
                formParams.append('branch', sanitizeForSheets(branch));
                formParams.append('enrollmentId', sanitizeForSheets(enrollmentId));
                formParams.append('teamName', sanitizeForSheets(teamName));

                if (responses) formParams.append('responses', JSON.stringify(responses));
                formParams.append('timestamp', new Date().toISOString());

                const sheetResponse = await fetch(sheetURL, {
                    method: 'POST',
                    body: formParams,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });

                if (!sheetResponse.ok) {
                    console.error('Google Sheet Error:', await sheetResponse.text());
                    throw new Error('Google Sheet responded with error');
                } else {
                    console.log('Google Sheet Submission Success');
                }
            }
        } catch (sheetError) {
            console.error('Google Sheet Submission Failed:', sheetError);
            throw sheetError;
        }
    })();

    // Execute both in parallel and wait for both to finish (succeed or fail)
    await Promise.allSettled([emailPromise, sheetPromise]);

    // 4. Return Success
    return res.status(200).json({ message: 'Registration successful!', id: docRef.id });
});
