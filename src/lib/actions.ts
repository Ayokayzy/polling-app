"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/superbase/server";

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // const data = Object.fromEntries(formData);

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email as string,
    password: formData.password as string,
  });

  if (error) {
    return {
      message: error.message,
      validate: false,
    };
  }

  redirect("/polls");
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const data = Object.fromEntries(formData);

  const { error } = await supabase.auth.signUp({
    email: data.email as string,
    password: data.password as string,
  });

  if (error) {
    return {
      message: error.message,
      validate: false,
    };
  }

  redirect("/polls");
}
