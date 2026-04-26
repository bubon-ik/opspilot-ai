import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkAuthPaths, publicAuthRoutes } from "@/lib/auth-config";

const isPublicRoute = createRouteMatcher([...publicAuthRoutes]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  {
    signInUrl: clerkAuthPaths.signInUrl,
    signUpUrl: clerkAuthPaths.signUpUrl
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
