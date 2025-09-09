import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import z from "zod";

/**
 * Retrieve the authenticated user's vote for a poll.
 *
 * If the URL contains the query parameter `check`, returns `{ hasVoted: boolean }`
 * indicating whether the user has a vote for the poll. Otherwise returns
 * `{ selectedOption: string | null }` where `selectedOption` is the stored choice
 * or `null` if the user hasn't voted.
 *
 * Responses:
 * - 200: Successful retrieval with one of the JSON shapes described above.
 * - 401: When no authenticated user is found.
 * - 500: On internal errors while accessing the database.
 *
 * @param params.id - Poll identifier extracted from the route (used to look up the vote).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const check = searchParams.get("check");

  try {
    const vote = await prisma.vote.findFirst({
      where: {
        pollId: params.id,
        userId: user.id,
      },
    });

    if (check) {
      return NextResponse.json({ hasVoted: !!vote });
    }

    return NextResponse.json({ selectedOption: vote?.selectedOption || null });
  } catch (error) {
    console.error("Error getting user vote:", error);
    return NextResponse.json(
      { message: "Failed to get user vote" },
      { status: 500 },
    );
  }
}

/**
 * Submit a vote for a poll on behalf of the authenticated user.
 *
 * Validates the request body for a `selectedOption`, ensures the poll exists,
 * verifies the option is one of the poll's choices, prevents duplicate votes
 * by the same user, and creates a new vote record.
 *
 * @param params.id - The ID of the poll to vote on
 * @returns A NextResponse with appropriate status codes:
 *  - 201 when the vote is created
 *  - 400 for validation errors or invalid option
 *  - 401 if the user is not authenticated
 *  - 404 if the poll does not exist
 *  - 409 if the user has already voted on the poll
 *  - 500 on unexpected server errors
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "You must be logged in to vote." },
      { status: 401 },
    );
  }

  const schema = z.object({
    selectedOption: z.string(),
  });

  const parsed = schema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // First verify the poll exists and the option is valid
    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      select: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ message: "Poll not found." }, { status: 404 });
    }

    const options = poll.options as string[];
    if (!options.includes(parsed.data.selectedOption)) {
      return NextResponse.json(
        { message: "Invalid voting option." },
        { status: 400 },
      );
    }

    // Check if user has already voted on this poll
    const existingVote = await prisma.vote.findFirst({
      where: {
        pollId: params.id,
        userId: user.id,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { message: "You have already voted on this poll." },
        { status: 409 },
      );
    }

    // Create the vote
    await prisma.vote.create({
      data: {
        pollId: params.id,
        userId: user.id,
        selectedOption: parsed.data.selectedOption,
      },
    });

    return NextResponse.json(
      { message: "Vote submitted successfully!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { message: "Failed to submit vote. Please try again." },
      { status: 500 },
    );
  }
}
