"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/superbase/actions";
import z from "zod";
import { prisma } from "./prisma";
import { pollFormSchema } from "@/components/create-poll-form";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function login(prevState: any, formData: FormData) {
  // Parse + validate using Zod
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    console.log({ error: parsed.error });
    const fieldErrors: Record<string, string> = {};
    const error = parsed.error;
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return {
      errors: fieldErrors,
      message: "Validation failed",
      validate: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      errors: {},
      message: error.message,
      validate: false,
    };
  }

  redirect("/polls");
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      message: "Please fix the errors below",
      validate: false,
      errors: {
        email: errors.email?.[0] || "",
        password: errors.password?.[0] || "",
      },
    };
  }

  const { data: signupData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: error.message,
      validate: false,
      errors: {},
    };
  }

  // Optionally sync with Prisma
  if (signupData.user && signupData.user.email) {
    try {
      await prisma.user.create({
        data: {
          id: signupData.user.id,
          email: signupData.user.email,
        },
      });
      return {
        message: "check mail to confirm your account",
        validate: true,
        errors: {},
      };
    } catch (error) {
      console.error(error);
      return {
        message: "Failed to create user",
        validate: false,
        errors: {},
      };
    }
  }

  redirect("/login");
}

export async function createPoll(
  prevState: any,
  formData: z.infer<typeof pollFormSchema>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "You must be logged in to create a poll.",
      validate: false,
    };
  }

  const schema = z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
  });

  const data = schema.parse({
    question: formData.question,
    options: formData.options,
  });
  console.log({ data });

  try {
    await prisma.poll.create({
      data: {
        ...data,
        creatorId: user.id,
      },
    });
    return {
      message: "Poll created successfully",
      validate: true,
      errors: {},
    };
  } catch (error) {
    console.log({ error });
    return {
      message: "Failed to create poll.",
      validate: false,
    };
  }
}

export async function updatePoll(
  id: string,
  prevState: any,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "You must be logged in to update a poll.",
      validate: false,
    };
  }

  const schema = z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
  });

  const data = schema.parse({
    question: formData.get("question"),
    options: Array.from(formData.getAll("options")),
  });

  try {
    await prisma.poll.update({
      where: {
        id,
        creatorId: user.id,
      },
      data: {
        question: data.question,
        options: data.options,
      },
    });

    redirect("/polls");
  } catch (error) {
    return {
      message: "Failed to update poll.",
      validate: false,
    };
  }
}

export async function deletePoll(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "You must be logged in to delete a poll.",
      success: false,
    };
  }

  try {
    await prisma.poll.delete({
      where: {
        id,
        creatorId: user.id,
      },
    });

    return {
      message: "Poll deleted successfully.",
      success: true,
    };
  } catch (error) {
    return {
      message: "Failed to delete poll.",
      success: false,
    };
  }
}

export async function getPollWithVotes(id: string) {
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
      {},
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

export async function submitVote(pollId: string, selectedOption: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "You must be logged in to vote.",
      success: false,
    };
  }

  try {
    // First verify the poll exists and the option is valid
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { options: true },
    });

    if (!poll) {
      return {
        message: "Poll not found.",
        success: false,
      };
    }

    const options = poll.options as string[];
    if (!options.includes(selectedOption)) {
      return {
        message: "Invalid voting option.",
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
        message: "You have already voted on this poll.",
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
    revalidatePath(`/polls/${pollId}`);

    return {
      message: "Vote submitted successfully!",
      success: true,
    };
  } catch (error) {
    console.error("Error submitting vote:", error);
    return {
      message: "Failed to submit vote. Please try again.",
      success: false,
    };
  }
}

export async function hasUserVoted(pollId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  try {
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

export async function getUserVote(pollId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
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
