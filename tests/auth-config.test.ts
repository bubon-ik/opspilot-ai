import { describe, expect, it } from "vitest";
import { clerkAuthPaths, isPublicAuthPath } from "@/lib/auth-config";

describe("auth route config", () => {
  it("defines local Clerk auth screens", () => {
    expect(clerkAuthPaths.signInUrl).toBe("/sign-in");
    expect(clerkAuthPaths.signUpUrl).toBe("/sign-up");
    expect(clerkAuthPaths.fallbackRedirectUrl).toBe("/");
  });

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
