"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import {
  submitVoteSchema,
  validateSchema
} from "@/lib/validations/schemas";
import { MESSAGES, ROUTES } from "@/constants";
import type { ActionResult, Vote } from "@/types";
import { getCurrentUser } from "./auth";

/**
 * Submit a vote for a poll
 * @param pollId - ID of the poll to vote on
 * @param selectedOption - The option the user selected
 * @returns Action result indicating success or failure
 */
export async function submitVote(
  pollId: string,
  selectedOption: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: MESSAGES.ERROR.UNAUTHORIZED,
        success: false,
      };
    }

    // Validate vote data
    const validation = validateSchema(submitVoteSchema, {
      pollId,
      selectedOption,
      userId: user.id,
    });

    if (!validation.success) {
      return {
        message: "Invalid vote data",
        success: false,
        errors: validation.errors,
      };
    }

    // First verify the poll exists and the option is valid
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { options: true },
    });

    if (!poll) {
      return {
        message: MESSAGES.ERROR.NOT_FOUND,
        success: false,
      };
    }

    const options = poll.options as string[];
    if (!options.includes(selectedOption)) {
      return {
        message: MESSAGES.ERROR.INVALID_OPTION,
        success: false,
      };
    }

    // Check if user has already voted on this poll
    const existingVote = await prisma.vote.findFirst({
      where: {
        pollId,
        userId: user.id,
      },
    });

    if (existingVote) {
      return {
        message: MESSAGES.ERROR.ALREADY_VOTED,
        success: false,
      };
    }

    // Create the vote
    await prisma.vote.create({
      data: {
        pollId,
        userId: user.id,
        selectedOption,
      },
    });

    // Revalidate the poll page to show updated results
    revalidatePath(ROUTES.POLL_DETAIL(pollId));

    return {
      message: MESSAGES.SUCCESS.VOTE_SUBMITTED,
      success: true,
    };
  } catch (error) {
    console.error("Error submitting vote:", error);
    return {
      message: MESSAGES.ERROR.SERVER_ERROR,
      success: false,
    };
  }
}

/**
 * Check if user has voted on a specific poll
 * @param pollId - ID of the poll to check
 * @returns Boolean indicating if user has voted
 */
export async function hasUserVoted(pollId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return false;
    }

    const vote = await prisma.vote.findFirst({
      where: {
        pollId,
        userId: user.id,
      },
    });

    return !!vote;
  } catch (error) {
    console.error("Error checking user vote:", error);
    return false;
  }
}

/**
 * Get user's vote for a specific poll
 * @param pollId - ID of the poll
 * @returns User's selected option or null if not voted
 */
export async function getUserVote(pollId: string): Promise<string | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    const vote = await prisma.vote.findFirst({
      where: {
        pollId,
        userId: user.id,
      },
      select: {
        selectedOption: true,
      },
    });

    return vote?.selectedOption || null;
  } catch (error) {
    console.error("Error getting user vote:", error);
    return null;
  }
}

/**
 * Get all votes for a specific poll
 * @param pollId - ID of the poll
 * @returns Array of votes
 */
export async function getPollVotes(pollId: string): Promise<Vote[]> {
  try {
    const votes = await prisma.vote.findMany({
      where: {
        pollId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return votes;
  } catch (error) {
    console.error("Error fetching poll votes:", error);
    return [];
  }
}

/**
 * Get user's voting history
 * @param options - Query options for pagination
 * @returns Array of user's votes
 */
export async function getUserVotingHistory(options?: {
  page?: number;
  limit?: number;
}): Promise<Vote[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    const votes = await prisma.vote.findMany({
      where: {
        userId: user.id,
      },
      include: {
        poll: {
          select: {
            id: true,
            question: true,
            creator: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return votes;
  } catch (error) {
    console.error("Error fetching user voting history:", error);
    return [];
  }
}

/**
 * Remove user's vote from a poll (if allowed)
 * @param pollId - ID of the poll
 * @returns Action result indicating success or failure
 */
export async function removeVote(pollId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: MESSAGES.ERROR.UNAUTHORIZED,
        success: false,
      };
    }

    // Check if vote exists
    const existingVote = await prisma.vote.findFirst({
      where: {
        pollId,
        userId: user.id,
      },
    });

    if (!existingVote) {
      return {
        message: "No vote found to remove",
        success: false,
      };
    }

    // Remove the vote
    await prisma.vote.delete({
      where: {
        id: existingVote.id,
      },
    });

    // Revalidate the poll page
    revalidatePath(ROUTES.POLL_DETAIL(pollId));

    return {
      message: "Vote removed successfully",
      success: true,
    };
  } catch (error) {
    console.error("Error removing vote:", error);
    return {
      message: MESSAGES.ERROR.SERVER_ERROR,
      success: false,
    };
  }
}

/**
 * Get vote statistics for multiple polls
 * @param pollIds - Array of poll IDs
 * @returns Vote statistics for each poll
 */
export async function getVoteStatistics(pollIds: string[]): Promise<
  Array<{
    pollId: string;
    totalVotes: number;
    uniqueVoters: number;
    votesPerOption: Record<string, number>;
  }>
> {
  try {
    const statistics = await Promise.all(
      pollIds.map(async (pollId) => {
        const votes = await prisma.vote.findMany({
          where: { pollId },
          select: {
            selectedOption: true,
            userId: true,
          },
        });

        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          select: { options: true },
        });

        if (!poll) {
          return {
            pollId,
            totalVotes: 0,
            uniqueVoters: 0,
            votesPerOption: {},
          };
        }

        const options = poll.options as string[];
        const votesPerOption: Record<string, number> = {};

        options.forEach((option) => {
          votesPerOption[option] = 0;
        });

        votes.forEach((vote) => {
          if (votesPerOption.hasOwnProperty(vote.selectedOption)) {
            votesPerOption[vote.selectedOption]++;
          }
        });

        const uniqueVoters = new Set(votes.map(vote => vote.userId)).size;

        return {
          pollId,
          totalVotes: votes.length,
          uniqueVoters,
          votesPerOption,
        };
      })
    );

    return statistics;
  } catch (error) {
    console.error("Error fetching vote statistics:", error);
    return [];
  }
}
