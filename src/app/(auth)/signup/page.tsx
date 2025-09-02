import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-bold">Sign Up</h2>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
