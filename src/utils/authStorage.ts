import type { AuthSession, AuthUser, StoredUser } from "../types/auth";
import { hashPassword, verifyPassword } from "./password";
import { generateId } from "./format";
import { initUserAppData } from "./storage";

const USERS_KEY = "loan-tracker-users";
const SESSION_KEY = "loan-tracker-session";

interface UsersRegistry {
  users: StoredUser[];
}

function loadRegistry(): UsersRegistry {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return { users: [] };
    return JSON.parse(raw) as UsersRegistry;
  } catch {
    return { users: [] };
  }
}

function saveRegistry(registry: UsersRegistry): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(registry));
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function setSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function sessionToUser(session: AuthSession): AuthUser {
  return { id: session.userId, email: session.email, name: session.name };
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser } | { error: string }> {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedName) return { error: "Name is required" };
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: "Enter a valid email address" };
  }
  if (password.length < 6) return { error: "Password must be at least 6 characters" };

  const registry = loadRegistry();
  if (registry.users.some((u) => u.email === normalizedEmail)) {
    return { error: "An account with this email already exists" };
  }

  const user: StoredUser = {
    id: generateId(),
    email: normalizedEmail,
    name: trimmedName,
    passwordHash: await hashPassword(password),
  };

  registry.users.push(user);
  saveRegistry(registry);
  initUserAppData(user.id);

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
  setSession(session);

  return { user: sessionToUser(session) };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Email is required" };
  if (!password) return { error: "Password is required" };

  const registry = loadRegistry();
  const user = registry.users.find((u) => u.email === normalizedEmail);
  if (!user) return { error: "Invalid email or password" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
  setSession(session);

  return { user: sessionToUser(session) };
}

export function signOut(): void {
  clearSession();
}
