import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware that enforces authentication and redirects between protected routes and auth pages.
 *
 * Detects the current Supabase authenticated user and:
 * - redirects authenticated users away from "/auth" pages to "/",
 * - redirects unauthenticated users accessing protected routes to "/login".
 *
 * @param request - The incoming Next.js request; used to read the request pathname and build redirect URLs.
 * @returns A NextResponse: either the unchanged `NextResponse.next()` to continue processing, or a redirect response to `/` or `/login`.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (data.user && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!data.user && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/polls/:path*"], // ✅ middleware only runs for protected routes
};
