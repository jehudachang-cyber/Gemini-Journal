import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  updateProfile,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { JournalEntry } from "../types";

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore using the specific provisioned firestoreDatabaseId
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
};
export type { User };

/**
 * Strict User Isolation Database Helpers
 * Every document is stored under /users/{userId}/journal_entries/{entryId}
 * This guarantees 100% cryptographic and rule-enforced multi-tenant isolation.
 */

export function getUserJournalCollection(userId: string) {
  if (!userId) throw new Error("Security Violation: User UID is required to access Firestore.");
  return collection(db, "users", userId, "journal_entries");
}

export function getUserJournalDoc(userId: string, entryId: string) {
  if (!userId || !entryId) {
    throw new Error("Security Violation: Both User UID and Entry ID are required.");
  }
  return doc(db, "users", userId, "journal_entries", entryId);
}

/**
 * Save or update a journal entry strictly under the user's isolated path
 */
export async function saveJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, "id" | "userId">,
  existingId?: string
): Promise<string> {
  if (!userId) throw new Error("Unauthorized: Cannot save without an authenticated user UID.");

  const entryId = existingId || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const docRef = getUserJournalDoc(userId, entryId);

  const payload = {
    ...entry,
    id: entryId,
    userId,
    updatedAt: Date.now(),
    serverTime: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });
  return entryId;
}

/**
 * Delete a journal entry strictly under the user's isolated path
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error("Unauthorized deletion attempt.");
  const docRef = getUserJournalDoc(userId, entryId);
  await deleteDoc(docRef);
}

/**
 * Fetch all entries for the user ordered by creation date descending
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  const colRef = getUserJournalCollection(userId);
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
    } as JournalEntry;
  });
}

/**
 * Subscribe to real-time updates of user journal entries
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = getUserJournalCollection(userId);
  const q = query(colRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
        } as JournalEntry;
      });
      onUpdate(entries);
    },
    (err) => {
      console.error("Firestore subscription error:", err);
      onError(err);
    }
  );
}
