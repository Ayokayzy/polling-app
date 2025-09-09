import { z } from "zod";

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Poll Schemas
export const pollFormSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(500, "Question must be less than 500 characters"),
  options: z
    .array(
      z
        .string()
        .min(1, "Option cannot be empty")
        .max(200, "Option must be less than 200 characters")
    )
    .min(2, "Poll must have at least 2 options")
    .max(10, "Poll cannot have more than 10 options")
    .refine((options) => {
      const uniqueOptions = new Set(options);
      return uniqueOptions.size === options.length;
    }, {
      message: "All options must be unique",
    }),
});

export const createPollSchema = pollFormSchema.extend({
  creatorId: z.string().min(1, "Creator ID is required"),
});

export const updatePollSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(500, "Question must be less than 500 characters")
    .optional(),
  options: z
    .array(
      z
        .string()
        .min(1, "Option cannot be empty")
        .max(200, "Option must be less than 200 characters")
    )
    .min(2, "Poll must have at least 2 options")
    .max(10, "Poll cannot have more than 10 options")
    .refine((options) => {
      const uniqueOptions = new Set(options);
      return uniqueOptions.size === options.length;
    }, {
      message: "All options must be unique",
    })
    .optional(),
});

// Vote Schemas
export const submitVoteSchema = z.object({
  pollId: z.string().min(1, "Poll ID is required"),
  selectedOption: z.string().min(1, "Selected option is required"),
  userId: z.string().min(1, "User ID is required"),
});

// API Schemas
export const pollParamsSchema = z.object({
  id: z.string().min(1, "Poll ID is required"),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  search: z.string().optional(),
});

export const pollFiltersSchema = paginationSchema.extend({
  creatorId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "question"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Environment Schemas
export const envSchema = z.object({
  DATABASE_URL: z.string().url("Invalid database URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required").optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NextAuth secret is required").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BASE_URL: z.string().url("Invalid base URL").optional(),
});

// QR Code Schemas
export const qrCodeOptionsSchema = z.object({
  width: z.number().min(50).max(1000).optional().default(200),
  height: z.number().min(50).max(1000).optional().default(200),
  margin: z.number().min(0).max(10).optional().default(4),
  color: z
    .object({
      dark: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
      light: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
    })
    .optional(),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query too long"),
  type: z.enum(["polls", "users"]).optional().default("polls"),
});

// Email Schemas
export const emailSchema = z.string().email("Invalid email address");

// ID Schemas
export const uuidSchema = z.string().uuid("Invalid UUID format");
export const idSchema = z.string().min(1, "ID is required");

// Type exports for inference
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PollFormInput = z.infer<typeof pollFormSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
export type PollParamsInput = z.infer<typeof pollParamsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PollFiltersInput = z.infer<typeof pollFiltersSchema>;
export type QRCodeOptionsInput = z.infer<typeof qrCodeOptionsSchema>;
export type SearchInput = z.infer<typeof searchSchema>;

// Validation utility functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });

    return {
      success: false,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      errors: {
        general: "Validation failed",
      },
    };
  }
};

// Form validation helpers
export const getFormErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (field && typeof field === 'string') {
      errors[field] = issue.message;
    }
  });
  return errors;
};

export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const data = Object.fromEntries(formData.entries());
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      errors: getFormErrors(result.error),
    };
  } catch (error) {
    return {
      success: false,
      errors: {
        general: "Form validation failed",
      },
    };
  }
};
