import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

/**
 * Signs out the currently authenticated Supabase user and navigates to the site root.
 *
 * This creates a Supabase client, awaits `auth.signOut()` to end the session, then calls `redirect("/")`.
 * No value is returned and errors from the sign-out call are not handled here.
 */
export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
