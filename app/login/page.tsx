import { signIn } from "@/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next || "/dashboard";

  async function handleSignIn(formData: FormData) {
    "use server";
    await signIn("nodemailer", { email: formData.get("email"), redirectTo: next });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone/30">
      <form action={handleSignIn} className="card p-8 w-full max-w-sm space-y-5 shadow-sm">
        <div>
          <h1 className="hero text-2xl mb-1">MouvementInk</h1>
          <p className="text-sm text-charcoal/60">
            Private. Enter your email and we&apos;ll send a sign-in link.
          </p>
        </div>
        <div className="space-y-1.5">
          <input
            type="email"
            name="email"
            autoFocus
            required
            className="input"
            placeholder="you@example.com"
          />
          {searchParams.error && (
            <p className="text-xs text-oxblood font-structural">
              that email isn&apos;t on the list — ask the owner to add you
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary w-full justify-center">
          Send sign-in link
        </button>
      </form>
    </div>
  );
}
