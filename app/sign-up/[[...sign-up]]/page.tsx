import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/app/auth-appearance";

export default function SignUpPage() {
  return (
    <main className="authShell">
      <section className="authHero" aria-label="OpsPilot AI sign up">
        <div>
          <p className="eyebrow">OpsPilot AI</p>
          <h1>Create your operations workspace</h1>
          <p className="lede">
            Start a private OpsPilot session for CSV intake, AI triage, human review, and export-ready operations handoff.
          </p>
        </div>
      </section>
      <section className="authPanel" aria-label="Sign up form">
        <SignUp appearance={authAppearance} signInUrl="/sign-in" fallbackRedirectUrl="/" />
      </section>
    </main>
  );
}
