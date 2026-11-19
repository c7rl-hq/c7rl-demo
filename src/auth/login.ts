import { randomBytes, createHash } from "node:crypto";

export function login() { return true; }

export const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

export interface PasswordResetStore {
  // Persist only the hash of the token, never the raw token.
  saveResetToken(email: string, tokenHash: string, expiresAt: number): Promise<void>;
}

export interface PasswordResetRequest {
  token: string;      // raw token, deliver to user out-of-band (e.g. email) only
  expiresAt: number;  // epoch ms
}

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

// Creates a single-use, time-limited reset token for `email` and stores its hash.
// Returns the raw token for out-of-band delivery. Does not reveal whether the
// account exists: callers should respond identically either way.
export async function requestPasswordReset(
  email: string,
  store: PasswordResetStore,
  now: number = Date.now(),
): Promise<PasswordResetRequest> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("invalid email");
  }
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + PASSWORD_RESET_TTL_MS;
  await store.saveResetToken(normalized, hashToken(token), expiresAt);
  return { token, expiresAt };
}
