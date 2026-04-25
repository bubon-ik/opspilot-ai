import { describe, expect, it } from "vitest";
import { isPublicAuthPath } from "@/lib/auth-config";

describe("auth route config", () => {
  it("keeps Clerk auth screens public", () => {
    expect(isPublicAuthPath("/sign-in")).toBe(true);
    expect(isPublicAuthPath("/sign-in/factor-one")).toBe(true);
    expect(isPublicAuthPath("/sign-up")).toBe(true);
    expect(isPublicAuthPath("/sign-up/verify-email-address")).toBe(true);
  });

  it("treats dashboard and triage API as protected paths", () => {
    expect(isPublicAuthPath("/")).toBe(false);
    expect(isPublicAuthPath("/api/triage")).toBe(false);
  });
});
