export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
}
