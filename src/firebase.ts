import { initializeApp, deleteApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updatePassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  or,
  and,
  orderBy, 
  limit, 
  startAfter,
  increment,
  writeBatch,
  getDocFromServer,
  getCountFromServer,
  serverTimestamp,
  loadBundle,
  namedQuery,
  enableNetwork,
  disableNetwork,
  getDocsFromCache,
  getDocFromCache
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Use initializeFirestore with persistentLocalCache to enable offline data access
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId);
    storage = getStorage(app);
  } else {
    app = getApp();
    auth = getAuth(app);
    try {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, firebaseConfig.firestoreDatabaseId);
    }
    storage = getStorage(app);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export {
  auth,
  db,
  storage,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  or,
  and,
  orderBy,
  limit,
  startAfter,
  increment,
  writeBatch,
  getCountFromServer,
  serverTimestamp,
  loadBundle,
  namedQuery,
  ref,
  uploadBytes,
  getDownloadURL,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  initializeApp,
  deleteApp,
  getAuth,
  firebaseConfig,
  enableNetwork,
  disableNetwork,
  getDocsFromCache,
  getDocFromCache
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isQuotaError = errorMessage.includes('Quota exceeded') || errorMessage.includes('quota');
  
  // Auto-disable network if quota is exceeded to save remaining "balance"
  if (isQuotaError) {
    console.warn('Firebase Quota Exceeded. Switching to offline mode.');
    disableNetwork(db).catch(console.error);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  if (isQuotaError) {
    console.warn('Firestore Quota Error: ', errorMessage);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  throw new Error(JSON.stringify(errInfo));
}

export async function seedDatabase(onProgress?: (progress: number) => void) {
  console.log('Starting database seeding...');
  
  if (!db) {
    throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
  }

  const { mockDb } = await import('./lib/mockDb');
  const collections = [
    'users', 
    'health_records', 
    'activities', 
    'queries', 
    'announcements', 
    'organic_reservations', 
    'breakfast_reservations', 
    'modules',
    'breakfast_items',
    'vegetables',
    'classrooms',
    'sports',
    'attendance',
    'badges',
    'likes',
    'comments'
  ];
  
  let totalItems = 0;
  for (const colName of collections) {
    const items = mockDb.getCollection(colName as any);
    console.log(`Collection ${colName} has ${items.length} items`);
    totalItems += items.length;
  }

  console.log(`Total items to seed: ${totalItems}`);

  if (totalItems === 0) {
    console.log('No items to seed.');
    onProgress?.(100);
    return;
  }

  let processedItems = 0;
  for (const colName of collections) {
    const data = mockDb.getCollection(colName as any);
    for (const item of data) {
      try {
        const { id, ...rest } = item;
        if (!id) {
          console.warn(`Skipping item in ${colName} because it has no id`, item);
          continue;
        }
        await setDoc(doc(db, colName, id), rest);
        processedItems++;
        onProgress?.(Math.round((processedItems / totalItems) * 100));
      } catch (err) {
        console.error(`Error seeding item in ${colName}:`, err);
        throw err; // Re-throw to be caught by the UI
      }
    }
  }
  console.log('Seeding complete!');
}
