"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <Link href="/polls" className="text-xl font-bold">
        Pollify
      </Link>
      <div className="flex gap-2">
        <Link href="/polls">
          <Button variant="ghost">Polls</Button>
        </Link>
        <Link href="/polls/new">
          <Button>Create Poll</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Login</Button>
        </Link>
        <Link href="/signup">
          <Button>Sign Up</Button>
        </Link>
      </div>
    </nav>
  );
}
