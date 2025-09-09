
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/superbase/actions";
import { prisma } from "@/lib/prisma";
import z from "zod";

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
