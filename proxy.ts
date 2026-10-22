import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Allowlist the protected surfaces instead of denylisting public ones — matches the
// pattern from the Forge reference repo, and avoids the sign-in/sign-up pages ever
// getting caught in their own auth check mid-redirect.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/workspace(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)",
    "/(api|trpc)(.*)",
  ],
};
