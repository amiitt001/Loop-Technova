/* global process */
import admin from 'firebase-admin';
import { safeHandler } from './utils/wrapper.js';
import { ValidationError, ConflictError } from './utils/errors.js';

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

    // 3. Send Email via EmailJS (Graceful Degradation)
    try {
        const serviceID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
        const templateID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY;

        if (serviceID && publicKey) {
            const templateParams = {
                to_name: "Admin", // Or User if we have a user template
                name,
                email,
                message: `New Registration for ${eventTitle} by ${name} (${email})`,
                reply_to: "technova@galgotias.edu"
            };

            const data = {
                service_id: serviceID,
                template_id: templateID,
                user_id: publicKey,
                template_params: templateParams
            };

            if (privateKey) data.accessToken = privateKey;

            // Fire and forget (await but catch error)
            const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!emailResponse.ok) {
                console.error('EmailJS Error (Silent Fail):', await emailResponse.text());
            }
        }
    } catch (emailError) {
        console.error("Email subsystem failed gracefully:", emailError);
    }

    // 4. Return Success
    return res.status(200).json({ message: 'Registration successful!', id: docRef.id });
});
