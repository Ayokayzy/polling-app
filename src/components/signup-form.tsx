"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useFormState, useFormStatus } from "react-dom";
import { signup } from "@/lib/actions";
import { useEffect } from "react";
import { toast } from "sonner";

// Define the form schema with Zod for validation.
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters long",
  }),
});

const initialState = {
  message: "",
  validate: true,
};

export function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState);
  const { pending } = useFormStatus();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!state.validate) {
      toast.error(state.message);
    } else if (state.message) {
      form.setError("root", {
        type: "manual",
        message: state.message,
      });
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormMessage>{state.validate && state.message}</FormMessage>
        <Button type="submit" disabled={pending}>
          {pending ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
}
