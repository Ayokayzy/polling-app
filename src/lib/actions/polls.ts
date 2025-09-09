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
 * Create a new poll
 * @param prevState - Previous form state
 * @param formData - Poll form data containing question and options
 * @returns Form state with validation results and messages
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
 * Update an existing poll
 * @param id - Poll ID
 * @param prevState - Previous form state
 * @param formData - Form data containing updated poll information
 * @returns Form state with validation results and messages
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
 * Delete a poll
 * @param id - Poll ID to delete
 * @returns Action result indicating success or failure
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
 * Get a single poll by ID with vote counts
 * @param id - Poll ID
 * @returns Poll with votes and vote counts, or null if not found
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
 * Get poll statistics
 * @param id - Poll ID
 * @returns Poll statistics including vote distribution
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
 * Check if a poll exists and user has access to it
 * @param id - Poll ID
 * @param userId - Optional user ID for ownership check
 * @returns Boolean indicating if poll exists and is accessible
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
