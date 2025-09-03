"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

const initialState = {
  message: "",
  validate: true,
  errors: {} as Record<string, string>,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Logging in..." : "Login"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);
  const { pending } = useFormStatus();
  console.log({ pending });

  // Show toast for general error messages
  useEffect(() => {
    console.log({ state });
    if (!state.validate && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <Input type="email" name="email" placeholder="you@example.com" />
        {state.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <Input type="password" name="password" placeholder="••••••••" />
        {state.errors?.password && (
          <p className="text-sm text-red-500">{state.errors.password}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
