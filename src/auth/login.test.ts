import { describe, it, expect, vi } from "vitest";
import { login, requestPasswordReset, resetPassword } from "./login";

describe("login", () => {
  it("still returns true (backward compatible)", () => {
    expect(login()).toBe(true);
  });
});

describe("password reset", () => {
  const MINUTE = 60 * 1000;

  it("issues a non-empty, unique token per request", () => {
    const a = requestPasswordReset("user-1");
    const b = requestPasswordReset("user-1");
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });

  it("resets the password for a valid token", () => {
    const update = vi.fn();
    const token = requestPasswordReset("user-2");
    expect(resetPassword(token, "new-password-123", update)).toBe(true);
    expect(update).toHaveBeenCalledWith("user-2", "new-password-123");
  });

  it("rejects a token that was already used (single use)", () => {
    const update = vi.fn();
    const token = requestPasswordReset("user-3");
    expect(resetPassword(token, "new-password-123", update)).toBe(true);
    expect(resetPassword(token, "another-password", update)).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("rejects an expired token without updating the password", () => {
    const update = vi.fn();
    const issuedAt = 1_000_000;
    const token = requestPasswordReset("user-4", issuedAt);
    const later = issuedAt + 16 * MINUTE;
    expect(resetPassword(token, "new-password-123", update, later)).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an unknown token", () => {
    const update = vi.fn();
    expect(resetPassword("not-a-real-token", "new-password-123", update)).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a too-short new password and leaves the token usable", () => {
    const update = vi.fn();
    const token = requestPasswordReset("user-5");
    expect(() => resetPassword(token, "short", update)).toThrow();
    expect(update).not.toHaveBeenCalled();
    expect(resetPassword(token, "long-enough-pw", update)).toBe(true);
  });
});
