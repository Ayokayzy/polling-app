import { z } from "zod";

// Database Models
export interface User {
  id: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  creatorId: string;
  creator?: Pick<User, 'email'>;
  createdAt?: Date;
  updatedAt?: Date;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  selectedOption: string;
  createdAt?: Date;
}

// Extended Poll Types
export interface PollWithVotes extends Poll {
  voteCounts: Record<string, number>;
  totalVotes: number;
  votes: Vote[];
  creator: Pick<User, 'email'>;
}

// Form State Types
export interface FormState {
  message: string;
  validate: boolean;
  errors?: Record<string, string>;
}

export interface ActionResult {
  message: string;
  success: boolean;
  errors?: Record<string, string>;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface AuthData {
  user: AuthUser | null;
}

// Component Props Types
export interface NavbarProps {
  className?: string;
}

export interface PollCardProps {
  poll: Poll;
  showActions?: boolean;
  className?: string;
}

export interface PollVotingProps {
  poll: PollWithVotes;
  userVote?: string | null;
  hasVoted: boolean;
  onVoteSubmit?: (option: string) => void;
}

export interface PollShareProps {
  pollId: string;
  question: string;
  className?: string;
}

// Form Props Types
export interface LoginFormProps {
  className?: string;
}

export interface SignupFormProps {
  className?: string;
}

export interface CreatePollFormProps {
  className?: string;
}

export interface EditPollFormProps {
  poll: Poll;
  className?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search and Filter Types
export interface PollFilters {
  search?: string;
  creatorId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'question';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

// Utility Types
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type UpdateFields<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Route Params Types
export interface PollParams {
  id: string;
}

export interface DashboardSearchParams {
  search?: string;
  page?: string;
  sort?: string;
}

// Configuration Types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  supabase: SupabaseConfig;
  baseUrl: string;
  environment: 'development' | 'production' | 'test';
}

// Event Types
export interface PollCreatedEvent {
  type: 'POLL_CREATED';
  pollId: string;
  creatorId: string;
  timestamp: Date;
}

export interface VoteSubmittedEvent {
  type: 'VOTE_SUBMITTED';
  pollId: string;
  userId: string;
  selectedOption: string;
  timestamp: Date;
}

export type AppEvent = PollCreatedEvent | VoteSubmittedEvent;

// Analytics Types
export interface PollStats {
  totalPolls: number;
  totalVotes: number;
  averageVotesPerPoll: number;
  mostPopularOptions: Array<{
    option: string;
    count: number;
  }>;
}

export interface UserStats {
  pollsCreated: number;
  votesSubmitted: number;
  joinDate: Date;
}

// QR Code Types
export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface ShareData {
  url: string;
  qrCode?: string;
  title: string;
  description: string;
}
