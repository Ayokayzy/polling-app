import { jest } from '@jest/globals';
import {
  login,
  signup,
  createPoll,
  updatePoll,
  deletePoll,
  getPollWithVotes,
  submitVote,
  hasUserVoted,
  getUserVote,
} from '@/lib/actions';

// Import mocked modules
const { redirect } = require('next/navigation');
const { revalidatePath } = require('next/cache');
const { createClient } = require('@/lib/superbase/actions');
const { prisma } = require('@/lib/prisma');

// Mock FormData
const createFormData = (data: Record<string, string | string[]>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

describe('Authentication Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      });

      await login({}, formData);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(redirect).toHaveBeenCalledWith('/polls');
    });

    it('should return validation errors for invalid email', async () => {
      const formData = createFormData({
        email: 'invalid-email',
        password: 'password123',
      });

      const result = await login({}, formData);

      expect(result).toEqual({
        errors: { email: 'Please enter a valid email' },
        message: 'Validation failed',
        validate: false,
      });
    });

    it('should return validation errors for short password', async () => {
      const formData = createFormData({
        email: 'test@example.com',
        password: '12345',
      });

      const result = await login({}, formData);

      expect(result).toEqual({
        errors: { password: 'Password must be at least 6 characters' },
        message: 'Validation failed',
        validate: false,
      });
    });

    it('should return error for failed authentication', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: { message: 'Invalid login credentials' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const formData = createFormData({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const result = await login({}, formData);

      expect(result).toEqual({
        errors: {},
        message: 'Invalid login credentials',
        validate: false,
      });
    });
  });

  describe('signup', () => {
    it('should successfully signup and create user in database', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await signup({}, formData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          email: 'test@example.com',
        },
      });
      expect(result).toEqual({
        message: 'check mail to confirm your account',
        validate: true,
        errors: {},
      });
    });

    it('should return validation errors for invalid email', async () => {
      const formData = createFormData({
        email: 'invalid-email',
        password: 'password123',
      });

      const result = await signup({}, formData);

      expect(result).toEqual({
        message: 'Please fix the errors below',
        validate: false,
        errors: {
          email: 'Invalid email',
          password: '',
        },
      });
    });

    it('should return validation errors for short password', async () => {
      const formData = createFormData({
        email: 'test@example.com',
        password: '12345',
      });

      const result = await signup({}, formData);

      expect(result).toEqual({
        message: 'Please fix the errors below',
        validate: false,
        errors: {
          email: '',
          password: 'Password must be at least 6 characters long',
        },
      });
    });

    it('should return error for Supabase signup failure', async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Email already registered' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await signup({}, formData);

      expect(result).toEqual({
        message: 'Email already registered',
        validate: false,
        errors: {},
      });
    });

    it('should return error for database user creation failure', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await signup({}, formData);

      expect(result).toEqual({
        message: 'Failed to create user',
        validate: false,
        errors: {},
      });
    });
  });
});

describe('Poll Management Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('should successfully create a poll', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.create as jest.Mock).mockResolvedValue({
        id: 'poll-123',
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
        creatorId: 'user-123',
      });

      const formData = {
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
      };

      const result = await createPoll({}, formData);

      expect(prisma.poll.create).toHaveBeenCalledWith({
        data: {
          question: 'What is your favorite color?',
          options: ['Red', 'Blue', 'Green'],
          creatorId: 'user-123',
        },
      });
      expect(result).toEqual({
        message: 'Poll created successfully',
        validate: true,
        errors: {},
      });
    });

    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const formData = {
        question: 'What is your favorite color?',
        options: ['Red', 'Blue'],
      };

      const result = await createPoll({}, formData);

      expect(result).toEqual({
        message: 'You must be logged in to create a poll.',
        validate: false,
      });
    });

    it('should return error for database creation failure', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const formData = {
        question: 'What is your favorite color?',
        options: ['Red', 'Blue'],
      };

      const result = await createPoll({}, formData);

      expect(result).toEqual({
        message: 'Failed to create poll.',
        validate: false,
      });
    });
  });

  describe('updatePoll', () => {
    it('should successfully update a poll', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.update as jest.Mock).mockResolvedValue({
        id: 'poll-123',
        question: 'Updated question?',
        options: ['Option A', 'Option B'],
        creatorId: 'user-123',
      });

      const formData = createFormData({
        question: 'Updated question?',
        options: ['Option A', 'Option B'],
      });

      await updatePoll('poll-123', {}, formData);

      expect(prisma.poll.update).toHaveBeenCalledWith({
        where: {
          id: 'poll-123',
          creatorId: 'user-123',
        },
        data: {
          question: 'Updated question?',
          options: ['Option A', 'Option B'],
        },
      });
      expect(redirect).toHaveBeenCalledWith('/polls');
    });

    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const formData = createFormData({
        question: 'Updated question?',
        options: ['Option A', 'Option B'],
      });

      const result = await updatePoll('poll-123', {}, formData);

      expect(result).toEqual({
        message: 'You must be logged in to update a poll.',
        validate: false,
      });
    });

    it('should return error for database update failure', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const formData = createFormData({
        question: 'Updated question?',
        options: ['Option A', 'Option B'],
      });

      const result = await updatePoll('poll-123', {}, formData);

      expect(result).toEqual({
        message: 'Failed to update poll.',
        validate: false,
      });
    });
  });

  describe('deletePoll', () => {
    it('should successfully delete a poll', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.delete as jest.Mock).mockResolvedValue({});

      const result = await deletePoll('poll-123');

      expect(prisma.poll.delete).toHaveBeenCalledWith({
        where: {
          id: 'poll-123',
          creatorId: 'user-123',
        },
      });
      expect(result).toEqual({
        message: 'Poll deleted successfully.',
        success: true,
      });
    });

    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await deletePoll('poll-123');

      expect(result).toEqual({
        message: 'You must be logged in to delete a poll.',
        success: false,
      });
    });

    it('should return error for database deletion failure', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await deletePoll('poll-123');

      expect(result).toEqual({
        message: 'Failed to delete poll.',
        success: false,
      });
    });
  });
});

describe('Poll Data and Voting Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPollWithVotes', () => {
    it('should successfully return poll with vote counts', async () => {
      const mockPoll = {
        id: 'poll-123',
        question: 'Favorite color?',
        options: ['Red', 'Blue', 'Green'],
        creator: { email: 'creator@example.com' },
        votes: [
          { selectedOption: 'Red' },
          { selectedOption: 'Blue' },
          { selectedOption: 'Red' },
        ],
      };
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);

      const result = await getPollWithVotes('poll-123');

      expect(prisma.poll.findUnique).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        include: {
          votes: true,
          creator: {
            select: {
              email: true,
            },
          },
        },
      });
      expect(result).toEqual({
        ...mockPoll,
        voteCounts: { Red: 2, Blue: 1, Green: 0 },
        totalVotes: 3,
      });
    });

    it('should return null when poll is not found', async () => {
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getPollWithVotes('nonexistent-poll');

      expect(result).toBeNull();
    });

    it('should return null and log error on database failure', async () => {
      (prisma.poll.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await getPollWithVotes('poll-123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching poll:', expect.any(Error));
    });
  });

  describe('submitVote', () => {
    it('should successfully submit a vote', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: ['Red', 'Blue', 'Green'],
      });
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vote.create as jest.Mock).mockResolvedValue({});

      const result = await submitVote('poll-123', 'Red');

      expect(prisma.poll.findUnique).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        select: { options: true },
      });
      expect(prisma.vote.findFirst).toHaveBeenCalledWith({
        where: { pollId: 'poll-123', userId: 'user-123' },
      });
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: {
          pollId: 'poll-123',
          userId: 'user-123',
          selectedOption: 'Red',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/polls/poll-123');
      expect(result).toEqual({
        message: 'Vote submitted successfully!',
        success: true,
      });
    });

    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await submitVote('poll-123', 'Red');

      expect(result).toEqual({
        message: 'You must be logged in to vote.',
        success: false,
      });
    });

    it('should return error when poll is not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await submitVote('poll-123', 'Red');

      expect(result).toEqual({
        message: 'Poll not found.',
        success: false,
      });
    });

    it('should return error when voting option is invalid', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: ['Red', 'Blue', 'Green'],
      });

      const result = await submitVote('poll-123', 'Yellow');

      expect(result).toEqual({
        message: 'Invalid voting option.',
        success: false,
      });
    });

    it('should return error when user has already voted', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: ['Red', 'Blue', 'Green'],
      });
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue({
        id: 'vote-123',
        selectedOption: 'Blue',
      });

      const result = await submitVote('poll-123', 'Red');

      expect(result).toEqual({
        message: 'You have already voted on this poll.',
        success: false,
      });
    });

    it('should return error on database failure', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: ['Red', 'Blue', 'Green'],
      });
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vote.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await submitVote('poll-123', 'Red');

      expect(result).toEqual({
        message: 'Failed to submit vote. Please try again.',
        success: false,
      });
    });
  });

  describe('hasUserVoted', () => {
    it('should return true when user has voted', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue({
        id: 'vote-123',
      });

      const result = await hasUserVoted('poll-123');

      expect(result).toBe(true);
    });

    it('should return false when user has not voted', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await hasUserVoted('poll-123');

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await hasUserVoted('poll-123');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.vote.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await hasUserVoted('poll-123');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error checking user vote:', expect.any(Error));
    });
  });

  describe('getUserVote', () => {
    it('should return user vote when user has voted', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue({
        selectedOption: 'Red',
      });

      const result = await getUserVote('poll-123');

      expect(result).toBe('Red');
    });

    it('should return null when user has not voted', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getUserVote('poll-123');

      expect(result).toBeNull();
    });

    it('should return null when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getUserVote('poll-123');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.vote.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await getUserVote('poll-123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error getting user vote:', expect.any(Error));
    });
  });
});
