import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="authShell">
      <section className="authHero" aria-label="OpsPilot AI sign in">
        <div>
          <p className="eyebrow">OpsPilot AI</p>
          <h1>Sign in to your operations workspace</h1>
          <p className="lede">
            Access the AI triage dashboard, process operational tickets, review recommendations, and export handoff queues.
          </p>
        </div>
      </section>
      <section className="authPanel" aria-label="Sign in form">
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      </section>
    </main>
  );
}
