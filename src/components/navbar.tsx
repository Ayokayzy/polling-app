import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "./user-nav";

/**
 * Server-side navigation component that renders a top navbar with links conditioned on authentication state.
 *
 * This async component creates a Supabase server client and fetches the current user session, then renders:
 * - If authenticated: links for Polls, Create Poll, Dashboard and a user menu (UserNav).
 * - If not authenticated: Login and Sign Up links.
 *
 * The component returns the navbar JSX and runs on the server (fetches auth state before rendering).
 *
 * @returns A Promise resolving to the navbar JSX element.
 */
export async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <Link href="/polls" className="text-xl font-bold">
        Pollify
      </Link>
      <div className="flex gap-2">
        {data.user ? (
          <div>
            <Link href="/polls">
              <Button variant="ghost">Polls</Button>
            </Link>
            <Link href="/polls/new">
              <Button>Create Poll</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <UserNav />
          </div>
        ) : (
          <>
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
