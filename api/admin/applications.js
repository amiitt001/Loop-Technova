
import admin from 'firebase-admin';
import { safeHandler } from '../_utils/wrapper.js';
import { verifyAdmin } from '../_utils/auth.js';
import { ValidationError as CustomValidationError } from '../_utils/errors.js';
import { sanitizeForSheets } from '../_utils/sanitizers.js';

// Note: db initialization moved inside handler to prevent cold-start crashes

export default safeHandler(async function handler(req, res) {
    // 1. Verify Admin Auth
    await verifyAdmin(req);

    // Initialize DB lazily to prevent cold-start crashes if init fails top-level
    const db = admin.firestore();

    const { id } = req.query;
    if (!id) {
        throw new CustomValidationError('Missing Application ID');
    }
    if (typeof id !== 'string') {
        throw new CustomValidationError('Application ID must be a string');
    }

    const appsRef = db.collection('applications').doc(id);
    const docSnap = await appsRef.get();

    if (!docSnap.exists) {
        throw new CustomValidationError('Application not found');
    }

    const appData = docSnap.data();
    const sheetURL = process.env.GOOGLE_SHEET_URL;

    // Helper to sync to sheet
    const syncToSheet = async (params) => {
        if (!sheetURL) {
            console.warn("GOOGLE_SHEET_URL not set, skipping sync.");
            return;
        }
        if (!appData.email) return;

        try {
            const formParams = new URLSearchParams();
            formParams.append('email', appData.email);
            for (const [key, value] of Object.entries(params)) {
                formParams.append(key, sanitizeForSheets(value));
            }

            // Do not await fetch to prevent blocking/failing the main request
            // We verify specific success/fail only via logs
            await fetch(sheetURL, {
                method: 'POST',
                body: formParams,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        } catch (error) {
            console.error('Google Sheet Sync Error:', error);
        }
    };

    // DELETE Action
    if (req.method === 'DELETE') {
        await appsRef.delete();

        // Sync
        if (appData.email) {
            await syncToSheet({ action: 'delete' });
        }

        return res.status(200).json({ message: 'Application deleted successfully' });
    }

    // UPDATE Action (PATCH)
    if (req.method === 'PATCH') {
        const body = req.body || {};
        const { status } = body;

        if (!status) {
            throw new CustomValidationError('Missing status field');
        }

        if (typeof status !== 'string') {
            throw new CustomValidationError('Status must be a string');
        }

        const allowedStatuses = ['Pending', 'Approved', 'Rejected'];
        if (!allowedStatuses.includes(status)) {
            throw new CustomValidationError('Invalid status value');
        }

        // validate status allowed values if needed
        await appsRef.update({ status });

        // Sync
        if (appData.email) {
            await syncToSheet({ action: 'updateStatus', status });
        }

        return res.status(200).json({ message: 'Application status updated' });
    }

    // Method Not Allowed
    res.setHeader('Allow', 'DELETE, PATCH');
    throw new CustomValidationError('Method Not Allowed (Use DELETE or PATCH)');
});
