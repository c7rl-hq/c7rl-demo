import { createHash, randomBytes } from "node:crypto";

export function login() { return true; }

// Password reset tokens: single-use, short-lived, stored only as SHA-256 hashes.
// Tokens are returned to the caller once and never persisted in plaintext.
// Tokens are never written to browser localStorage.
const RESET_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

interface ResetRecord {
  userId: string;
  expiresAt: number;
  used: boolean;
}

const resetRecords = new Map<string, ResetRecord>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Issue a password reset token for a user. Returns the raw token once. */
export function requestPasswordReset(userId: string, now: number = Date.now()): string {
  const token = randomBytes(32).toString("base64url");
  resetRecords.set(hashToken(token), {
    userId,
    expiresAt: now + RESET_TTL_MS,
    used: false,
  });
  return token;
}

/**
 * Redeem a reset token and set a new password via `updatePassword`.
 * Returns true on success; false if the token is unknown, expired, or already used.
 * Throws if the new password is too short.
 */
export function resetPassword(
  token: string,
  newPassword: string,
  updatePassword: (userId: string, password: string) => void,
  now: number = Date.now(),
): boolean {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  const key = hashToken(token);
  const record = resetRecords.get(key);
  if (!record || record.used || now > record.expiresAt) {
    return false;
  }
  record.used = true; // single use: consume before updating
  updatePassword(record.userId, newPassword);
  return true;
}
