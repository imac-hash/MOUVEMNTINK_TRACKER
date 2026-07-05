import Link from "next/link";
import { auth, signOut } from "@/auth";
import * as store from "@/lib/store";

export default async function GatedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email;
  const isOwner = store.isOwnerEmail(email);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8">
      <header className="flex items-center justify-between py-6 border-b border-line mb-8">
        <Link href="/dashboard" className="flex items-baseline gap-3 group">
          <span className="hero text-xl tracking-tight group-hover:text-navy transition-colors">
            MouvementInk
          </span>
          <span className="label">projects</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-structural uppercase tracking-wide text-charcoal/60">
          <Link href="/dashboard" className="hover:text-navy transition-colors">
            triage
          </Link>
          <Link href="/entities" className="hover:text-navy transition-colors">
            entities
          </Link>
          {isOwner && (
            <Link href="/collaborators" className="hover:text-navy transition-colors">
              collaborators
            </Link>
          )}
          <span className="text-charcoal/40 normal-case font-sans">{email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="hover:text-oxblood transition-colors">sign out</button>
          </form>
        </nav>
      </header>
      <main className="pb-24">{children}</main>
      <footer className="text-xs text-charcoal/40 italic border-t border-line py-4">
        © 2026 IJ Mackay Movement Inc. · MouvementInk · isaacmackay.com
      </footer>
    </div>
  );
}
