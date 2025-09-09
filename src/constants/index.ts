// Application Constants
export const APP_NAME = "Pollify";
export const APP_DESCRIPTION = "Create and share polls with QR codes";
export const APP_VERSION = "1.0.0";

// URL Constants
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  POLLS: "/polls",
  POLLS_NEW: "/polls/new",
  DASHBOARD: "/dashboard",
  POLL_DETAIL: (id: string) => `/polls/${id}`,
  POLL_EDIT: (id: string) => `/polls/${id}/edit`,
  API: {
    POLLS: "/api/polls",
    POLL_DETAIL: (id: string) => `/api/polls/${id}`,
    POLL_VOTE: (id: string) => `/api/polls/${id}/vote`,
  },
} as const;

// Authentication Constants
export const AUTH = {
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
} as const;

// Poll Constants
export const POLL = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MAX_QUESTION_LENGTH: 500,
  MAX_OPTION_LENGTH: 200,
  DEFAULT_POLL_LIMIT: 10,
  MAX_POLL_LIMIT: 100,
} as const;

// Validation Messages
export const MESSAGES = {
  ERROR: {
    REQUIRED: "This field is required",
    EMAIL_INVALID: "Please enter a valid email address",
    PASSWORD_TOO_SHORT: `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`,
    PASSWORD_TOO_LONG: `Password must be less than ${AUTH.PASSWORD_MAX_LENGTH} characters`,
    POLL_QUESTION_REQUIRED: "Poll question is required",
    POLL_QUESTION_TOO_LONG: `Question must be less than ${POLL.MAX_QUESTION_LENGTH} characters`,
    POLL_OPTIONS_MIN: `Poll must have at least ${POLL.MIN_OPTIONS} options`,
    POLL_OPTIONS_MAX: `Poll cannot have more than ${POLL.MAX_OPTIONS} options`,
    POLL_OPTION_EMPTY: "Option cannot be empty",
    POLL_OPTION_TOO_LONG: `Option must be less than ${POLL.MAX_OPTION_LENGTH} characters`,
    POLL_OPTIONS_DUPLICATE: "All options must be unique",
    UNAUTHORIZED: "You must be logged in to perform this action",
    FORBIDDEN: "You don't have permission to perform this action",
    NOT_FOUND: "Resource not found",
    ALREADY_VOTED: "You have already voted on this poll",
    INVALID_OPTION: "Invalid voting option",
    SERVER_ERROR: "Something went wrong. Please try again later",
    NETWORK_ERROR: "Network error. Please check your connection",
  },
  SUCCESS: {
    LOGIN: "Successfully logged in",
    LOGOUT: "Successfully logged out",
    SIGNUP: "Account created successfully. Please check your email to confirm",
    POLL_CREATED: "Poll created successfully",
    POLL_UPDATED: "Poll updated successfully",
    POLL_DELETED: "Poll deleted successfully",
    VOTE_SUBMITTED: "Vote submitted successfully",
    COPIED_TO_CLIPBOARD: "Copied to clipboard",
  },
  INFO: {
    LOADING: "Loading...",
    NO_POLLS: "No polls found",
    NO_VOTES: "No votes yet",
    CONFIRM_DELETE: "Are you sure you want to delete this poll?",
    CHECK_EMAIL: "Please check your email to confirm your account",
  },
} as const;

// UI Constants
export const UI = {
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    "2XL": 1536,
  },
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  QR_CODE: {
    DEFAULT_SIZE: 200,
    MIN_SIZE: 50,
    MAX_SIZE: 1000,
    DEFAULT_MARGIN: 4,
    DEFAULT_COLORS: {
      DARK: "#000000",
      LIGHT: "#FFFFFF",
    },
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Database Constants
export const DATABASE = {
  MAX_CONNECTIONS: 100,
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  QUERY_TIMEOUT: 30000, // 30 seconds
} as const;

// Cache Constants
export const CACHE = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
  },
  KEYS: {
    POLLS: "polls",
    POLL: (id: string) => `poll:${id}`,
    USER_POLLS: (userId: string) => `user:${userId}:polls`,
    USER_VOTES: (userId: string) => `user:${userId}:votes`,
    POLL_STATS: (pollId: string) => `poll:${pollId}:stats`,
  },
} as const;

// Environment Constants
export const ENVIRONMENT = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  LOGIN_ATTEMPTS: {
    MAX: 5,
    WINDOW: 15 * 60 * 1000, // 15 minutes
  },
  API_REQUESTS: {
    MAX: 100,
    WINDOW: 60 * 1000, // 1 minute
  },
  POLL_CREATION: {
    MAX: 10,
    WINDOW: 60 * 60 * 1000, // 1 hour
  },
} as const;

// File Upload Constants
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  MAX_FILES: 5,
} as const;

// Analytics Constants
export const ANALYTICS = {
  EVENTS: {
    POLL_CREATED: "poll_created",
    POLL_VIEWED: "poll_viewed",
    VOTE_SUBMITTED: "vote_submitted",
    POLL_SHARED: "poll_shared",
    QR_CODE_GENERATED: "qr_code_generated",
    USER_REGISTERED: "user_registered",
    USER_LOGIN: "user_login",
  },
} as const;

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9-]+$/,
} as const;

// Feature Flags
export const FEATURES = {
  QR_CODE_GENERATION: true,
  POLL_ANALYTICS: true,
  EMAIL_NOTIFICATIONS: false,
  SOCIAL_SHARING: true,
  POLL_EXPIRATION: false,
  USER_PROFILES: false,
  POLL_COMMENTS: false,
} as const;

// Default Values
export const DEFAULTS = {
  POLL: {
    OPTIONS: ["Yes", "No"],
    QUESTION: "",
  },
  PAGINATION: {
    PAGE: 1,
    LIMIT: 10,
  },
  SORT: {
    BY: "createdAt" as const,
    ORDER: "desc" as const,
  },
} as const;
