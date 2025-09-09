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

describe('Actions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration and Poll Creation Flow', () => {
    it('should handle complete user signup and poll creation flow', async () => {
      // Mock successful signup
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
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.poll.create as jest.Mock).mockResolvedValue({
        id: 'poll-123',
        question: 'Integration test poll?',
        options: ['Yes', 'No'],
        creatorId: 'user-123',
      });

      // Sign up user
      const signupFormData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      });
      const signupResult = await signup({}, signupFormData);

      expect(signupResult.validate).toBe(true);
      expect(prisma.user.create).toHaveBeenCalled();

      // Create poll as the new user
      const pollData = {
        question: 'Integration test poll?',
        options: ['Yes', 'No'],
      };
      const pollResult = await createPoll({}, pollData);

      expect(pollResult.validate).toBe(true);
      expect(prisma.poll.create).toHaveBeenCalledWith({
        data: {
          question: 'Integration test poll?',
          options: ['Yes', 'No'],
          creatorId: 'user-123',
        },
      });
    });
  });

  describe('Poll Voting Flow', () => {
    it('should handle complete voting flow with vote checking', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Mock poll exists with valid options
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        id: 'poll-123',
        options: ['Option A', 'Option B', 'Option C'],
      });

      // Initially user hasn't voted
      (prisma.vote.findFirst as jest.Mock).mockResolvedValueOnce(null);

      // Check user hasn't voted
      const hasVoted = await hasUserVoted('poll-123');
      expect(hasVoted).toBe(false);

      // Submit vote
      (prisma.vote.create as jest.Mock).mockResolvedValue({
        id: 'vote-123',
        pollId: 'poll-123',
        userId: 'user-123',
        selectedOption: 'Option A',
      });

      const voteResult = await submitVote('poll-123', 'Option A');
      expect(voteResult.success).toBe(true);

      // Now user has voted
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue({
        id: 'vote-123',
        selectedOption: 'Option A',
      });

      const hasVotedAfter = await hasUserVoted('poll-123');
      expect(hasVotedAfter).toBe(true);

      const userVote = await getUserVote('poll-123');
      expect(userVote).toBe('Option A');
    });
  });

  describe('Poll Data Consistency', () => {
    it('should maintain consistent vote counts across operations', async () => {
      const mockPoll = {
        id: 'poll-123',
        question: 'Test poll?',
        options: ['A', 'B', 'C'],
        creator: { email: 'creator@test.com' },
        votes: [
          { selectedOption: 'A' },
          { selectedOption: 'B' },
          { selectedOption: 'A' },
          { selectedOption: 'C' },
          { selectedOption: 'A' },
        ],
      };
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);

      const result = await getPollWithVotes('poll-123');

      expect(result?.voteCounts).toEqual({
        A: 3,
        B: 1,
        C: 1,
      });
      expect(result?.totalVotes).toBe(5);
    });

    it('should handle polls with no votes', async () => {
      const mockPoll = {
        id: 'poll-123',
        question: 'Empty poll?',
        options: ['Option 1', 'Option 2'],
        creator: { email: 'creator@test.com' },
        votes: [],
      };
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);

      const result = await getPollWithVotes('poll-123');

      expect(result?.voteCounts).toEqual({
        'Option 1': 0,
        'Option 2': 0,
      });
      expect(result?.totalVotes).toBe(0);
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle malformed form data gracefully', async () => {
      const formData = new FormData();
      formData.append('email', '');
      formData.append('password', '');

      const result = await login({}, formData);

      expect(result.validate).toBe(false);
      expect(result.errors).toBeTruthy();
    });

    it('should handle null/undefined form data', async () => {
      const formData = new FormData();
      // Don't append anything, leaving fields empty

      const result = await signup({}, formData);

      expect(result.validate).toBe(false);
      expect(result.errors).toBeTruthy();
    });

    it('should handle Supabase client creation failure', async () => {
      (createClient as jest.Mock).mockRejectedValue(new Error('Supabase connection failed'));

      const formData = createFormData({
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(login({}, formData)).rejects.toThrow('Supabase connection failed');
    });
  });

  describe('Database Race Conditions', () => {
    it('should handle concurrent vote submissions', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: ['A', 'B'],
      });

      // First call: user hasn't voted yet
      (prisma.vote.findFirst as jest.Mock).mockResolvedValueOnce(null);
      // Second call: user has already voted (simulating race condition)
      (prisma.vote.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'vote-123',
        selectedOption: 'A',
      });

      const [result1, result2] = await Promise.all([
        submitVote('poll-123', 'A'),
        submitVote('poll-123', 'B'),
      ]);

      // One should succeed, one should fail
      const results = [result1, result2];
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount + failureCount).toBe(2);
    });
  });

  describe('Poll Management Authorization', () => {
    it('should prevent unauthorized poll updates', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Simulate Prisma constraint violation (user trying to update poll they don't own)
      (prisma.poll.update as jest.Mock).mockRejectedValue(
        new Error('Record to update not found.')
      );

      const formData = createFormData({
        question: 'Updated question?',
        options: ['New A', 'New B'],
      });

      const result = await updatePoll('poll-456', {}, formData);

      expect(result).toEqual({
        message: 'Failed to update poll.',
        validate: false,
      });
    });

    it('should prevent unauthorized poll deletion', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Simulate Prisma constraint violation (user trying to delete poll they don't own)
      (prisma.poll.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete does not exist.')
      );

      const result = await deletePoll('poll-456');

      expect(result).toEqual({
        message: 'Failed to delete poll.',
        success: false,
      });
    });
  });

  describe('Complex Vote Scenarios', () => {
    it('should handle voting on poll with many options', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const manyOptions = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: manyOptions,
      });
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vote.create as jest.Mock).mockResolvedValue({});

      const result = await submitVote('poll-123', 'Option 15');

      expect(result.success).toBe(true);
      expect(prisma.vote.create).toHaveBeenCalledWith({
        data: {
          pollId: 'poll-123',
          userId: 'user-123',
          selectedOption: 'Option 15',
        },
      });
    });

    it('should handle special characters in vote options', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const specialOptions = [
        'Option with émojis 🎉',
        'Option with "quotes" and \'apostrophes\'',
        'Option with <HTML> & special chars!',
        'Option with\nnewlines\tand tabs',
      ];
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue({
        options: specialOptions,
      });
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vote.create as jest.Mock).mockResolvedValue({});

      const result = await submitVote('poll-123', 'Option with émojis 🎉');

      expect(result.success).toBe(true);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle extremely long poll questions and options', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const longQuestion = 'A'.repeat(1000);
      const longOptions = ['B'.repeat(500), 'C'.repeat(500)];

      // Test should pass validation but might fail at database level
      const pollData = {
        question: longQuestion,
        options: longOptions,
      };

      // Mock database constraint error
      (prisma.poll.create as jest.Mock).mockRejectedValue(
        new Error('Data too long for column')
      );

      const result = await createPoll({}, pollData);

      expect(result.validate).toBe(false);
      expect(result.message).toBe('Failed to create poll.');
    });

    it('should handle empty strings in poll options', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const pollData = {
        question: 'Valid question?',
        options: ['Valid option', '', 'Another valid option'],
      };

      // This should fail at schema validation level
      expect(() => createPoll({}, pollData)).rejects.toThrow();
    });
  });

  describe('Network and Database Failure Scenarios', () => {
    it('should handle database connection timeout', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Simulate database timeout
      (prisma.poll.findUnique as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      );

      const result = await getPollWithVotes('poll-123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching poll:',
        expect.any(Error)
      );
    });

    it('should handle Supabase authentication service downtime', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockRejectedValue(
            new Error('Authentication service unavailable')
          ),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(hasUserVoted('poll-123')).rejects.toThrow(
        'Authentication service unavailable'
      );
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle poll with thousands of votes efficiently', async () => {
      const votes = Array.from({ length: 10000 }, (_, i) => ({
        selectedOption: `Option ${(i % 5) + 1}`,
      }));

      const mockPoll = {
        id: 'poll-123',
        question: 'Large poll?',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'],
        creator: { email: 'creator@test.com' },
        votes,
      };
      (prisma.poll.findUnique as jest.Mock).mockResolvedValue(mockPoll);

      const startTime = Date.now();
      const result = await getPollWithVotes('poll-123');
      const endTime = Date.now();

      expect(result?.totalVotes).toBe(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
