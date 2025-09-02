import { createClient } from "@/lib/superbase/client";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
