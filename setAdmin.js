/* setAdmin.js */
import admin from 'firebase-admin';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const makeAdmin = async (email) => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`Success! ${email} is now an ADMIN.`);
    } catch (error) {
        console.error('Error:', error);
    }
};

// REPLACE THIS WITH YOUR EMAIL
makeAdmin('amitverma2k99@gmail.com');