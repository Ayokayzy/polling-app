import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "./user-nav";

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
