import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ensureUserSettings } from "../services/firestoreService";
import type { AuthUser } from "../types/auth";

function mapFirebaseUser(fb: {
  uid: string;
  email: string | null;
  displayName: string | null;
}): AuthUser {
  return {
    id: fb.uid,
    email: fb.email ?? "",
    name: fb.displayName ?? fb.email?.split("@")[0] ?? "User",
  };
}

export async function firebaseSignUp(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser } | { error: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await setDoc(doc(db, "users", cred.user.uid, "profile", "main"), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    });
    await ensureUserSettings(cred.user.uid);
    return { user: mapFirebaseUser({ ...cred.user, displayName: name.trim() }) };
  } catch (e: unknown) {
    return { error: mapAuthError(e) };
  }
}

export async function firebaseSignIn(
  email: string,
  password: string
): Promise<{ user: AuthUser } | { error: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: mapFirebaseUser(cred.user) };
  } catch (e: unknown) {
    return { error: mapAuthError(e) };
  }
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

function mapAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/invalid-email": "Invalid email address",
    "auth/weak-password": "Password must be at least 6 characters",
    "auth/user-not-found": "Invalid email or password",
    "auth/wrong-password": "Invalid email or password",
    "auth/invalid-credential": "Invalid email or password",
    "auth/too-many-requests": "Too many attempts. Try again later",
  };
  return messages[code] ?? (e as Error)?.message ?? "Authentication failed";
}
