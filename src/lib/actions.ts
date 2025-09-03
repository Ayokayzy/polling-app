"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/superbase/actions";
import z from "zod";
import { prisma } from "./prisma";
import { pollFormSchema } from "@/components/create-poll-form";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function login(prevState: any, formData: FormData) {
  // Parse + validate using Zod
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    console.log({ error: parsed.error });
    const fieldErrors: Record<string, string> = {};
    const error = parsed.error;
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return {
      errors: fieldErrors,
      message: "Validation failed",
      validate: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      errors: {},
      message: error.message,
      validate: false,
    };
  }

  redirect("/polls");
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      message: "Please fix the errors below",
      validate: false,
      errors: {
        email: errors.email?.[0] || "",
        password: errors.password?.[0] || "",
      },
    };
  }

  const { data: signupData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: error.message,
      validate: false,
      errors: {},
    };
  }

  // Optionally sync with Prisma
  if (signupData.user) {
    try {
      await prisma.user.create({
        data: {
          id: signupData.user.id,
          email: signupData.user.email,
        },
      });
      return {
        message: "check mail to confirm your account",
        validate: true,
        errors: {},
      };
    } catch (error) {
      console.error(error);
      return {
        message: "Failed to create user",
        validate: false,
        errors: {},
      };
    }
  }

  redirect("/login");
}

export async function createPoll(
  prevState: any,
  formData: z.infer<typeof pollFormSchema>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "You must be logged in to create a poll.",
      validate: false,
    };
  }

  const schema = z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
  });

  const data = schema.parse({
    question: formData.question,
    options: formData.options,
  });
  console.log({ data });

  try {
    await prisma.poll.create({
      data: {
        ...data,
        creatorId: user.id,
      },
    });
    return {
      message: "Poll created successfully",
      validate: true,
      errors: {},
    };
  } catch (error) {
    console.log({ error });
    return {
      message: "Failed to create poll.",
      validate: false,
    };
  }
}
