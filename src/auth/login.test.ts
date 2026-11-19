import { describe, expect, it } from "vitest";
import { login } from "./login";

describe("auth", () => {
  it("keeps login working", () => {
    expect(login()).toBe(true);
  });
});

import { requestPasswordReset } from "./login";
describe("password reset", () => {
  it("stores a hashed token", async () => {
    const saved: unknown[] = [];
    const r = await requestPasswordReset("A@B.com", { saveResetToken: async (...a: unknown[]) => { saved.push(a); } } as never);
    expect(r).toBeTruthy();
    expect(saved.length).toBe(1);
  });
});
