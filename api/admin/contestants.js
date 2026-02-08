
import admin from 'firebase-admin';
import { safeHandler } from '../utils/wrapper.js';
import { verifyAdmin } from '../utils/auth.js';
import { ValidationError as CustomValidationError } from '../utils/errors.js';

// Note: db initialization moved inside handler to prevent cold-start crashes

export default safeHandler(async function handler(req, res) {
    // 1. Verify Admin Auth
    await verifyAdmin(req);

    // Initialize DB lazily to prevent cold-start crashes if init fails top-level
    const db = admin.firestore();

    const { id } = req.query;
    if (!id) {
        throw new CustomValidationError('Missing Contestant ID');
    }

    const contestantRef = db.collection('contestants').doc(id);
    const docSnap = await contestantRef.get();

    if (!docSnap.exists) {
        throw new CustomValidationError('Contestant not found');
    }

    // DELETE Action
    if (req.method === 'DELETE') {
        await contestantRef.delete();
        return res.status(200).json({ message: 'Contestant deleted successfully' });
    }

    // UPDATE Action (PATCH)
    if (req.method === 'PATCH') {
        const body = req.body || {};
        const { name, platformHandle, points, contestName } = body;

        // Validate required fields
        if (!name || !platformHandle) {
            throw new CustomValidationError('Missing required fields: name and platformHandle are required');
        }

        // Validate points
        if (points !== undefined && points !== null) {
            const pointsNum = Number(points);
            if (isNaN(pointsNum) || pointsNum < 0) {
                throw new CustomValidationError('Points must be a non-negative number');
            }
        }

        // Prepare update data
        const updateData = {
            name,
            platformHandle,
            points: Number(points) || 0,
        };

        // Add optional contestName if provided
        if (contestName !== undefined) {
            updateData.contestName = contestName;
        }

        await contestantRef.update(updateData);

        return res.status(200).json({ message: 'Contestant updated successfully' });
    }

    // Method Not Allowed
    res.setHeader('Allow', 'DELETE, PATCH');
    throw new CustomValidationError('Method Not Allowed (Use DELETE or PATCH)');
});
