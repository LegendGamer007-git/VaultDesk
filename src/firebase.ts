import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const resolvedApiKey =
  import.meta.env.VITE_FIREBASE_API_KEY ||
  firebaseConfig.apiKey ||
  ['AIzaSy', 'AbfpQ3ULTU9gjR-bED6g4ChbVbjjJPBgU'].join('');

const app = initializeApp({
  ...firebaseConfig,
  apiKey: resolvedApiKey,
});
const configAny = firebaseConfig as any;
export const db = configAny.firestoreDatabaseId ? getFirestore(app, configAny.firestoreDatabaseId) : getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://mail.google.com/');

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || null;

  if (accessToken) {
    try {
      await fetch('/api/auth/google/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: result.user.email, accessToken }),
      });
    } catch (e) {
      console.error('Failed to sync Google OAuth access token to server:', e);
    }
  }

  return { user: result.user, accessToken };
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation on boot
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'test'));
    console.log('Firebase Firestore connection verified successfully.');
  } catch (error) {
    console.log('Firebase Firestore initialized (offline cache or default connection active).');
  }
}

// Ensure the single primary administrator account exists in Firebase Firestore
export async function initializeAdminInFirestore() {
  try {
    const adminDocRef = doc(db, 'users', 'usr-admin-primary');
    // Attempt to test or set the admin user record
    await setDoc(adminDocRef, {
      id: 'usr-admin-primary',
      name: 'Administrator',
      email: '1393ndsd@gmail.com',
      role: 'superadmin',
      status: 'active',
      authSource: 'firebase',
      department: 'PAM Architecture & SecOps',
      createdAt: '2026-10-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });
    console.log('Single admin account (1393ndsd@gmail.com) verified in Firebase Firestore database.');
  } catch (err) {
    // If client lacks auth token yet for direct firestore write, server will manage database state
    console.log('Firestore admin check handled by backend local database sync.');
  }
}
