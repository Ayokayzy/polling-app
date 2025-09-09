import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/actions";
import { prisma } from "@/lib/prisma";
import z from "zod";

/**
 * HTTP GET handler that returns all polls.
 *
 * Retrieves all polls from the database and includes each poll's creator email.
 * On success returns a JSON response with the polls (200). On failure returns a
 * JSON error message with a 500 status.
 *
 * @returns A NextResponse containing the polls array on success or an error object on failure.
 */
export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      include: {
        creator: {
          select: {
            email: true,
          },
        },
      },
    });
    return NextResponse.json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { message: "Failed to fetch polls" },
      { status: 500 },
    );
  }
}

/**
 * Creates a new poll for the authenticated user.
 *
 * Expects a JSON body with:
 * - `question`: non-empty string
 * - `options`: array of strings with at least two items
 *
 * Responses:
 * - 201: created poll (JSON)
 * - 401: when the request is not authenticated
 * - 400: validation failed (response includes validation error details)
 * - 500: server error when creating the poll
 *
 * @param req - NextRequest whose JSON body must contain `question` and `options` as described above.
 * @returns A NextResponse containing the created poll or an error message with an appropriate HTTP status.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "You must be logged in to create a poll." },
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
    const poll = await prisma.poll.create({
      data: {
        ...parsed.data,
        creatorId: user.id,
      },
    });
    return NextResponse.json(poll, { status: 201 });
  } catch (error) {
    console.log({ error });
    return NextResponse.json(
      { message: "Failed to create poll." },
      { status: 500 },
    );
  }
}
