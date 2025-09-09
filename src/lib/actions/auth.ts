"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import { loginSchema, signupSchema, validateSchema } from "@/lib/validations/schemas";
import { MESSAGES, ROUTES } from "@/constants";
import type { FormState } from "@/types";

/**
 * Authenticate a user with an email and password and redirect to the polls page on success.
 *
 * Validates `formData` against the login schema; on validation or authentication failure
 * returns a FormState containing per-field errors (when available) and a user-facing message.
 * On successful sign-in this action redirects to ROUTES.POLLS and does not return a FormState.
 *
 * @param prevState - Previous form state (preserved by callers; not modified by this action)
 * @param formData - FormData expected to contain `email` and `password`
 * @returns A FormState with validation errors and a message when validation or sign-in fails.
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
 * Handle user signup: validate form data, create a Supabase account, sync the new user to Prisma, and return a FormState describing the result.
 *
 * Validates `email` and `password` from `formData`. On validation failure returns per-field errors and a message. On Supabase sign-up failure returns the provider error message. If sign-up succeeds and a user record with an email is returned, the function attempts to create a corresponding Prisma user record and returns a success FormState; if the Prisma sync fails it returns a failure message. If sign-up does not yield a user record the function redirects to the login route.
 *
 * @param prevState - Previous form state (passed through by the caller; not used by this action)
 * @param formData - FormData containing `email` and `password`
 * @returns A FormState object with `message`, `validate` (boolean), and `errors` (per-field error strings)
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
 * Signs out the current user via Supabase and redirects to the home route.
 *
 * If sign-out fails, the error is logged and the function still redirects to the home route
 * to ensure client-side session state is cleared.
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
 * Retrieve the currently authenticated Supabase user.
 *
 * Returns the authenticated user object if a session exists; returns `null` if no user is authenticated or if an error occurs while fetching the user. This function does not throw; errors are logged and result in `null`.
 *
 * @returns The Supabase `User` object when authenticated, otherwise `null`.
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
 * Returns whether a user is currently authenticated.
 *
 * Resolves to `true` if a current user session exists, otherwise `false`. If an error occurs while checking the session, the function returns `false`.
 *
 * @returns `true` when a signed-in user is found; `false` otherwise.
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
 * Ensure the current request is authenticated; if not, redirect to the login page.
 *
 * If `redirectTo` is provided, it will be URL-encoded and appended as `?redirect=` so the user can be returned after signing in.
 *
 * @param redirectTo - Optional path or URL to return the user to after successful login
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
