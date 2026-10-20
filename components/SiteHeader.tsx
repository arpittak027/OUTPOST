"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton, OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlanButton } from "@/components/PlanButton";

// Shared across every route (root layout). The landing page gets its section links and a way into
// the app; inside the app, the logo leads home to the dashboard and the plan button takes its place.
export function SiteHeader() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const isLandingPage = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-white/6 bg-[#0c0d12]/80 px-6 backdrop-blur-xl md:px-10 transition-all">
      <Link href={isSignedIn && !isLandingPage ? "/dashboard" : "/"} className="flex items-center transition-transform hover:scale-[1.02]">
        <Image src="/brand/logo-navbar-dark.png" alt="Outpost" width={314} height={160} className="h-8 w-auto" priority />
      </Link>
      {isLandingPage && (
        <nav className="hidden items-center gap-8 text-xs md:text-sm font-medium text-zinc-400 md:flex">
          <Link href="#product" className="transition-colors hover:text-white">Product</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-white">How it works</Link>
          <Link href="#pricing" className="transition-colors hover:text-white">Pricing</Link>
        </nav>
      )}
      <div className="flex items-center gap-3">
        {/* <Show> swaps branches once Clerk resolves the session, so the header reflects real auth state */}
        {/* Modal mode opens Clerk's form over the page; /sign-in and /sign-up stay for redirects. */}
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="text-xs text-zinc-300 hover:text-white hover:bg-white/5">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="h-8 px-3.5 bg-[#f59e0b] hover:bg-[#ea580c] text-black font-semibold text-xs rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get started
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          {/* Membership-optional: hidePersonal=false lets a solo user stay on their personal
              account instead of being forced to create/join an org. */}
          <OrganizationSwitcher afterCreateOrganizationUrl="/dashboard" afterSelectOrganizationUrl="/dashboard" />
          {isLandingPage ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-8 px-3.5 bg-[#f59e0b] hover:bg-[#ea580c] text-black font-semibold text-xs rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Dashboard
            </Link>
          ) : (
            <PlanButton />
          )}
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
