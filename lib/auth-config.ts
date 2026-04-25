export const publicAuthRoutes = ["/sign-in(.*)", "/sign-up(.*)"] as const;

export const clerkAuthPaths = {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  fallbackRedirectUrl: "/"
} as const;

export function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/sign-in" || pathname.startsWith("/sign-in/") || pathname === "/sign-up" || pathname.startsWith("/sign-up/");
}
