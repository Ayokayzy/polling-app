
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/superbase/actions";
import { prisma } from "@/lib/prisma";
import z from "zod";

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
