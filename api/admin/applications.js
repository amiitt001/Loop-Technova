
import admin from 'firebase-admin';
import { safeHandler } from '../utils/wrapper.js';
import { checkMethod, ValidationError } from '../utils/errors.js'; // Assuming checkMethod logic or doing it manually
import { verifyAdmin } from '../utils/auth.js';
import { ValidationError as CustomValidationError } from '../utils/errors.js';

const db = admin.firestore();

export default safeHandler(async function handler(req, res) {
    // 1. Verify Admin Auth
    await verifyAdmin(req);

    const { id } = req.query;
    if (!id) {
        throw new CustomValidationError('Missing Application ID');
    }

    const appsRef = db.collection('applications').doc(id);

    // DELETE Action
    if (req.method === 'DELETE') {
        await appsRef.delete();
        return res.status(200).json({ message: 'Application deleted successfully' });
    }

    // UPDATE Action (PATCH)
    if (req.method === 'PATCH') {
        const { status } = req.body;
        if (!status) {
            throw new CustomValidationError('Missing status field');
        }

        // validate status allowed values if needed
        await appsRef.update({ status });
        return res.status(200).json({ message: 'Application status updated' });
    }

    // Method Not Allowed
    res.setHeader('Allow', 'DELETE, PATCH');
    throw new CustomValidationError('Method Not Allowed (Use DELETE or PATCH)');
});
