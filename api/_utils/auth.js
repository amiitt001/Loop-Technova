
/* global process */
import admin from 'firebase-admin';
import { UnauthorizedError, ForbiddenError } from './errors.js';

// Ensure Firebase Admin is initialized (shared instance)
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

/**
 * Validates the Firebase ID Token from the Authorization header.
 * Throws UnauthorizedError if invalid.
 * Returns the decoded token if valid.
 */
export const verifyAdmin = async (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired token');
    }

    if (decodedToken.admin !== true) {
        throw new ForbiddenError('User is not an admin');
    }

    return decodedToken;
};
