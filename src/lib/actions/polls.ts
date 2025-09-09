"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import {
  pollFormSchema,
  createPollSchema,
  updatePollSchema,
  validateSchema
} from "@/lib/validations/schemas";
import { MESSAGES, ROUTES } from "@/constants";
import type { FormState, ActionResult, Poll, PollWithVotes } from "@/types";
import { getCurrentUser } from "./auth";

/**
 * Create a new poll from submitted form data.
 *
 * Validates `formData` (question and options), requires the current user to be authenticated,
 * and persists the poll with the authenticated user set as the creator.
 *
 * @param prevState - Previous form state (preserved caller-side state; not used for validation)
 * @param formData - Object containing `question` and `options` for the poll
 * @returns A Promise resolving to a FormState describing the result:
 *          `message` (user-facing status), `validate` (true on success), and optional `errors`
 */
export async function createPoll(
  prevState: any,
  formData: any
): Promise<FormState> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: MESSAGES.ERROR.UNAUTHORIZED,
        validate: false,
      };
    }

    // Validate form data
    const validation = validateSchema(pollFormSchema, {
      question: formData.question,
      options: formData.options,
    });

    if (!validation.success) {
      return {
        message: "Please fix the validation errors",
        validate: false,
        errors: validation.errors,
      };
    }

    // Create poll with user ID
    const pollData = createPollSchema.parse({
      ...validation.data!,
      creatorId: user.id,
    });

    await prisma.poll.create({
      data: pollData,
    });

    return {
      message: MESSAGES.SUCCESS.POLL_CREATED,
      validate: true,
      errors: {},
    };
  } catch (error) {
    console.error("Create poll error:", error);
    return {
      message: MESSAGES.ERROR.SERVER_ERROR,
      validate: false,
    };
  }
}

/**
 * Validate and apply updates to an existing poll, then revalidate and redirect to the polls page.
 *
 * Validates incoming form data against the update schema, ensures the current user is the poll's creator,
 * and updates the poll in the database. On successful update this action triggers revalidation of the
 * polls route and redirects to the polls page. If the user is unauthenticated, validation fails, or a
 * server error occurs, a FormState with an appropriate message and validation flag is returned.
 *
 * @param id - The ID of the poll to update.
 * @param formData - FormData containing updated fields (`question` and repeated `options`).
 * @returns A FormState describing validation results or an error. On successful update the function redirects
 *          and does not return a normal FormState result. 
 */
export async function updatePoll(
  id: string,
  prevState: any,
  formData: FormData
): Promise<FormState> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: MESSAGES.ERROR.UNAUTHORIZED,
        validate: false,
      };
    }

    // Prepare update data
    const rawData = {
      question: formData.get("question") as string,
      options: Array.from(formData.getAll("options")) as string[],
    };

    // Validate form data
    const validation = validateSchema(updatePollSchema, rawData);

    if (!validation.success) {
      return {
        message: "Please fix the validation errors",
        validate: false,
        errors: validation.errors,
      };
    }

    // Update poll (only if user is the creator)
    await prisma.poll.update({
      where: {
        id,
        creatorId: user.id,
      },
      data: validation.data!,
    });

    // Revalidate and redirect
    revalidatePath(ROUTES.POLLS);
    redirect(ROUTES.POLLS);
  } catch (error) {
    console.error("Update poll error:", error);
    return {
      message: MESSAGES.ERROR.SERVER_ERROR,
      validate: false,
    };
  }
}

/**
 * Delete a poll owned by the current authenticated user.
 *
 * Deletes the poll with the given `id` only if the currently authenticated user is the poll's creator.
 * On success, triggers revalidation for the polls and dashboard pages and returns a success result.
 * If no user is authenticated, returns an unauthorized result. On unexpected errors returns a server error result.
 *
 * @param id - ID of the poll to delete; deletion will only occur if the current user is the poll's creator
 * @returns An ActionResult with `success: true` on successful deletion, or `success: false` with an error message otherwise
 */
export async function deletePoll(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: MESSAGES.ERROR.UNAUTHORIZED,
        success: false,
      };
    }

    // Delete poll (only if user is the creator)
    await prisma.poll.delete({
      where: {
        id,
        creatorId: user.id,
      },
    });

    // Revalidate the polls page
    revalidatePath(ROUTES.POLLS);
    revalidatePath(ROUTES.DASHBOARD);

    return {
      message: MESSAGES.SUCCESS.POLL_DELETED,
      success: true,
    };
  } catch (error) {
    console.error("Delete poll error:", error);
    return {
      message: MESSAGES.ERROR.SERVER_ERROR,
      success: false,
    };
  }
}

/**
 * Get all polls with pagination and filtering
 * @param options - Query options for filtering and pagination
 * @returns Array of polls
 */
export async function getPolls(options?: {
  page?: number;
  limit?: number;
  search?: string;
  creatorId?: string;
}): Promise<Poll[]> {
  try {
    const { page = 1, limit = 10, search, creatorId } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.question = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    const polls = await prisma.poll.findMany({
      where,
      include: {
        creator: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return polls;
  } catch (error) {
    console.error("Get polls error:", error);
    return [];
  }
}

/**
 * Retrieve a poll by its ID and return it augmented with per-option vote counts and total votes.
 *
 * Fetches the poll (including its votes and the creator's email). If found, computes a
 * mapping of each option to the number of votes it received (`voteCounts`) and the
 * total number of votes (`totalVotes`), then returns the original poll fields plus
 * those additions.
 *
 * @param id - The poll's unique identifier.
 * @returns The poll object augmented with `voteCounts: Record<string, number>` and
 *          `totalVotes: number`, or `null` if the poll does not exist or an error occurs.
 */
export async function getPollWithVotes(id: string): Promise<PollWithVotes | null> {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        votes: true,
        creator: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!poll) {
      return null;
    }

    // Calculate vote counts for each option
    const options = poll.options as string[];
    const voteCounts = options.reduce(
      (acc: Record<string, number>, option: string) => {
        acc[option] = 0;
        return acc;
      },
      {}
    );

    poll.votes.forEach((vote) => {
      if (voteCounts.hasOwnProperty(vote.selectedOption)) {
        voteCounts[vote.selectedOption]++;
      }
    });

    return {
      ...poll,
      voteCounts,
      totalVotes: poll.votes.length,
    };
  } catch (error) {
    console.error("Error fetching poll:", error);
    return null;
  }
}

/**
 * Get polls created by the current user
 * @param options - Query options
 * @returns Array of user's polls
 */
export async function getUserPolls(options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Poll[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    return getPolls({
      ...options,
      creatorId: user.id,
    });
  } catch (error) {
    console.error("Get user polls error:", error);
    return [];
  }
}

/**
 * Compute statistics for a poll.
 *
 * Retrieves the poll with its votes and returns aggregated statistics per option.
 *
 * @param id - The poll's unique identifier.
 * @returns An object containing:
 *  - poll: { id, question, creator, createdAt }
 *  - totalVotes: total number of votes
 *  - options: array of { option, votes, percentage } for each poll option
 *  - mostVotedOption: the option entry with the highest vote count
 *  or `null` if the poll does not exist or an error occurs.
 */
export async function getPollStats(id: string) {
  try {
    const poll = await getPollWithVotes(id);

    if (!poll) {
      return null;
    }

    const options = poll.options as string[];
    const totalVotes = poll.totalVotes;

    const stats = options.map((option) => ({
      option,
      votes: poll.voteCounts[option] || 0,
      percentage: totalVotes > 0
        ? Math.round(((poll.voteCounts[option] || 0) / totalVotes) * 100)
        : 0,
    }));

    return {
      poll: {
        id: poll.id,
        question: poll.question,
        creator: poll.creator,
        createdAt: poll.createdAt,
      },
      totalVotes,
      options: stats,
      mostVotedOption: stats.reduce((prev, current) =>
        (prev.votes > current.votes) ? prev : current
      ),
    };
  } catch (error) {
    console.error("Get poll stats error:", error);
    return null;
  }
}

/**
 * Return true if a poll with the given `id` exists. If `userId` is provided, the poll must also be owned by that user.
 *
 * @param id - Poll ID to check
 * @param userId - Optional user ID to require ownership
 * @returns `true` when the poll exists (and is owned by `userId` if provided); `false` when not found or on error
 */
export async function canAccessPoll(id: string, userId?: string): Promise<boolean> {
  try {
    const whereClause: any = { id };

    if (userId) {
      whereClause.creatorId = userId;
    }

    const poll = await prisma.poll.findFirst({
      where: whereClause,
      select: { id: true },
    });

    return !!poll;
  } catch (error) {
    console.error("Can access poll error:", error);
    return false;
  }
}
