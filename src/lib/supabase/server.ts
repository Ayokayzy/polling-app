import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// This client is for Server Components, Server Actions, and Route Handlers.
/**
 * Create a Supabase server client that reads and manages session cookies from the Next.js request.
 *
 * The returned client is configured to use the current request's cookies:
 * - `getAll()` returns all cookies from the request.
 * - `setAll()` attempts to set multiple cookies; setting will succeed in Server Actions or Route Handlers but may fail silently in Server Components.
 *
 * @returns A Supabase server client instance configured for server-side use with cookie handling.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // Cookies can only be modified in Server Actions or Route Handlers
            // In Server Components, this will fail silently
          }
        },
      },
    },
  );
}
