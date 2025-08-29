import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
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
  )
}
