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
 * Submits the current authenticated user's vote for a poll.
 *
 * Validates input and poll/option existence, prevents double-voting, creates a vote record,
 * and triggers revalidation of the poll detail page. Requires an authenticated user.
 *
 * @returns An ActionResult indicating success or failure; on success `success: true` with a success message, otherwise `success: false` with an error message and (when validation fails) validation errors.
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
 * Determine whether the current authenticated user has already voted on a poll.
 *
 * Returns true if a vote by the current user exists for the given poll; returns false if the user is unauthenticated, no vote is found, or an error occurs.
 *
 * @param pollId - ID of the poll to check
 * @returns True when the current user has a vote for `pollId`, otherwise false
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
 * Retrieve the current user's selected option for a given poll.
 *
 * Returns the selected option string, or `null` if the user is not authenticated,
 * has not voted on the poll, or an error occurs while fetching the vote.
 *
 * @returns The user's `selectedOption` for the poll, or `null`.
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
 * Retrieve all votes for a given poll, including each voter's email.
 *
 * Returns vote records for the specified `pollId`, with the related user's
 * email selected and results ordered by `createdAt` descending. On error an
 * empty array is returned.
 *
 * @param pollId - The ID of the poll to fetch votes for.
 * @returns An array of Vote records (each includes `user.email`).
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
 * Retrieve the current user's voting history with optional pagination.
 *
 * Returns the authenticated user's votes ordered by newest first, including basic poll info (poll id, question, and creator email).
 *
 * @param options - Pagination options. `page` is 1-based (default 1). `limit` is items per page (default 10).
 * @returns An array of Vote records for the current user; returns an empty array if unauthenticated or on error.
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
 * Removes the current user's vote for the specified poll.
 *
 * If the user is not authenticated, returns an unauthorized result. If the user has not voted
 * on the poll, returns a failure result indicating no vote was found. On success the vote is
 * deleted and the poll detail page is revalidated.
 *
 * @returns An ActionResult: `{ success: true, message: "Vote removed successfully" }` on success,
 * otherwise `{ success: false, message: string }` describing the failure.
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
 * Computes vote statistics for each provided poll ID.
 *
 * For each poll returns total votes, number of unique voters, and a per-option tally.
 * If a poll ID does not exist the statistics for that poll use zeros and an empty `votesPerOption` object.
 *
 * @param pollIds - Array of poll IDs to compute statistics for.
 * @returns An array of statistics objects in the same order as `pollIds`. Each object contains:
 * - `pollId`: the poll id
 * - `totalVotes`: total number of vote records for the poll
 * - `uniqueVoters`: count of distinct userIds that voted
 * - `votesPerOption`: mapping of each poll option to its vote count
 * On unexpected errors this function returns an empty array.
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
