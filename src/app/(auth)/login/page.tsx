import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/superbase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is logged in, redirect them away from the login page.
  if (user) {
    redirect("/");
  }
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-bold">Login</h2>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
        </CardContent>
      </Card>
    </div>
  );
}
