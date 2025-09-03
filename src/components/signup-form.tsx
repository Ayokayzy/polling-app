"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormState, useFormStatus } from "react-dom";
import { signup } from "@/lib/actions";
import { useEffect } from "react";
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
      {pending ? "Signing up..." : "Sign Up"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState);

  useEffect(() => {
    if (!state.validate && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          disabled={pending}
        />
        {state.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <Input
          type="password"
          name="password"
          placeholder="••••••••"
          disabled={pending}
        />
        {state.errors?.password && (
          <p className="text-sm text-red-500">{state.errors.password}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
