import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import z from "zod";

/**
 * Retrieve a poll by ID with its votes and creator email, and return per-option vote counts and total vote count.
 *
 * If the poll is not found, responds with a 404 and a JSON message. On success returns the poll object augmented with
 * `voteCounts` (Record<option, number>) and `totalVotes`. On unexpected errors responds with a 500 and a JSON message.
 *
 * @param params - Route parameters; `params.id` is the poll's unique identifier.
 * @returns A NextResponse containing the poll data with `voteCounts` and `totalVotes`, or an error message with status 404/500.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
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
      return NextResponse.json({ message: "Poll not found" }, { status: 404 });
    }

    // Calculate vote counts for each option
    const options = poll.options as string[];
    const voteCounts = options.reduce(
      (acc: Record<string, number>, option: string) => {
        acc[option] = 0;
        return acc;
      },
      {},
    );

    poll.votes.forEach((vote) => {
      if (voteCounts.hasOwnProperty(vote.selectedOption)) {
        voteCounts[vote.selectedOption]++;
      }
    });

    return NextResponse.json({
      ...poll,
      voteCounts,
      totalVotes: poll.votes.length,
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { message: "Failed to fetch poll" },
      { status: 500 },
    );
  }
}

/**
 * Updates a poll by ID for the authenticated creator.
 *
 * Validates the request body (requires a non-empty `question` and at least two `options`), ensures the caller is authenticated,
 * and updates the poll record whose `id` matches `params.id` and whose `creatorId` matches the authenticated user's id.
 * Returns the updated poll on success.
 *
 * @param params.id - The poll ID to update
 * @returns A NextResponse containing the updated poll on success, or a JSON error with status:
 * - 401 if the request is unauthenticated
 * - 400 if validation fails (response includes validation errors)
 * - 500 if the update operation fails
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "You must be logged in to update a poll." },
      { status: 401 },
    );
  }

  const schema = z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
  });

  const parsed = schema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const poll = await prisma.poll.update({
      where: {
        id: params.id,
        creatorId: user.id,
      },
      data: {
        question: parsed.data.question,
        options: parsed.data.options,
      },
    });

    return NextResponse.json(poll);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update poll." },
      { status: 500 },
    );
  }
}

/**
 * Delete a poll owned by the authenticated user.
 *
 * Returns 401 if the request is unauthenticated, 500 if deletion fails, and 200 with a success message on success.
 *
 * @param params.id - ID of the poll to delete
 * @returns A NextResponse with a JSON message and appropriate HTTP status code
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "You must be logged in to delete a poll." },
      { status: 401 },
    );
  }

  try {
    await prisma.poll.delete({
      where: {
        id: params.id,
        creatorId: user.id,
      },
    });

    return NextResponse.json({ message: "Poll deleted successfully." });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete poll." },
      { status: 500 },
    );
  }
}
