import { describe, expect, it } from "vitest";
import { login } from "./login";

describe("auth", () => {
  it("keeps login working", () => {
    expect(login()).toBe(true);
  });
});
