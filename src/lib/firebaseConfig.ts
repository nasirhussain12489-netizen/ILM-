export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId: string;
  oAuthClientId: string;
  recaptchaSiteKey: string;
}

/**
 * Authoritative Firebase configuration.
 * Uses the verified project credentials from firebase-applet-config.json
 * with optional runtime environment variable overrides.
 * This TypeScript module eliminates Node.js ESM ERR_IMPORT_ATTRIBUTE_MISSING errors
 * in serverless environments like Vercel.
 */
export const firebaseConfig: FirebaseAppletConfig = {
  projectId:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)) ||
    'wired-spanner-kpthm',
  appId:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID)) ||
    '1:834787025438:web:0f1f83b030f12ab1a5840f',
  apiKey:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY)) ||
    'AIzaSyC_RoK4CfXIrJ_zXyWv4FCnUf48Zzo4puo',
  authDomain:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN)) ||
    'wired-spanner-kpthm.firebaseapp.com',
  firestoreDatabaseId:
    (typeof process !== 'undefined' &&
      (process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID)) ||
    'ai-studio-ilmintegratedlea-89cc9677-1a61-458a-bc14-34ef179f878b',
  storageBucket:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET)) ||
    'wired-spanner-kpthm.firebasestorage.app',
  messagingSenderId:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_MESSAGING_SENDER_ID ||
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID)) ||
    '834787025438',
  measurementId: '',
  oAuthClientId:
    (typeof process !== 'undefined' &&
      (process.env.FIREBASE_OAUTH_CLIENT_ID ||
        process.env.VITE_FIREBASE_OAUTH_CLIENT_ID)) ||
    '834787025438-0hs419m4s2qutp0gbd35v5v829ln52ch.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

export default firebaseConfig;
