"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import { loginSchema, signupSchema, validateSchema } from "@/lib/validations/schemas";
import { MESSAGES, ROUTES } from "@/constants";
import type { FormState } from "@/types";

/**
 * Login action for user authentication
 * @param prevState - Previous form state
 * @param formData - Form data containing email and password
 * @returns Form state with validation results and messages
 */
export async function login(prevState: any, formData: FormData): Promise<FormState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input data
  const validation = validateSchema(loginSchema, rawData);

  if (!validation.success) {
    return {
      errors: validation.errors || {},
      message: MESSAGES.ERROR.SERVER_ERROR,
      validate: false,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(validation.data!);

    if (error) {
      return {
        errors: {},
        message: error.message,
        validate: false,
      };
    }

    redirect(ROUTES.POLLS);
  } catch (error) {
    console.error("Login error:", error);
    return {
      errors: {},
      message: MESSAGES.ERROR.SERVER_ERROR,
      validate: false,
    };
  }
}

/**
 * Signup action for user registration
 * @param prevState - Previous form state
 * @param formData - Form data containing email and password
 * @returns Form state with validation results and messages
 */
export async function signup(prevState: any, formData: FormData): Promise<FormState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input data
  const validation = validateSchema(signupSchema, rawData);

  if (!validation.success) {
    const errors = validation.errors || {};
    return {
      message: "Please fix the errors below",
      validate: false,
      errors: {
        email: errors.email || "",
        password: errors.password || "",
      },
    };
  }

  try {
    const supabase = await createClient();
    const { data: signupData, error } = await supabase.auth.signUp(validation.data!);

    if (error) {
      return {
        message: error.message,
        validate: false,
        errors: {},
      };
    }

    // Sync with Prisma database
    if (signupData.user && signupData.user.email) {
      try {
        await prisma.user.create({
          data: {
            id: signupData.user.id,
            email: signupData.user.email,
          },
        });

        return {
          message: MESSAGES.SUCCESS.SIGNUP,
          validate: true,
          errors: {},
        };
      } catch (dbError) {
        console.error("Database sync error:", dbError);
        return {
          message: "Failed to create user profile",
          validate: false,
          errors: {},
        };
      }
    }

    redirect(ROUTES.LOGIN);
  } catch (error) {
    console.error("Signup error:", error);
    return {
      message: MESSAGES.ERROR.SERVER_ERROR,
      validate: false,
      errors: {},
    };
  }
}

/**
 * Logout action for user sign out
 * Redirects to home page after successful logout
 */
export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(ROUTES.HOME);
  } catch (error) {
    console.error("Logout error:", error);
    // Still redirect even if there's an error to clear client-side state
    redirect(ROUTES.HOME);
  }
}

/**
 * Get current authenticated user
 * @returns User data or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Get user error:", error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns Boolean indicating authentication status
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error("Authentication check error:", error);
    return false;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * @param redirectTo - Optional redirect path after login
 */
export async function requireAuth(redirectTo?: string): Promise<void> {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    const loginUrl = redirectTo
      ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectTo)}`
      : ROUTES.LOGIN;
    redirect(loginUrl);
  }
}
