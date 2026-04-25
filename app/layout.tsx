import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAuthPaths } from "@/lib/auth-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsPilot AI",
  description: "AI workflow triage dashboard for operations teams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInUrl={clerkAuthPaths.signInUrl}
          signUpUrl={clerkAuthPaths.signUpUrl}
          signInFallbackRedirectUrl={clerkAuthPaths.fallbackRedirectUrl}
          signUpFallbackRedirectUrl={clerkAuthPaths.fallbackRedirectUrl}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
