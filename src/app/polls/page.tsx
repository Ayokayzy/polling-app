import { PollCard } from "@/components/poll-card";
import { createClient } from "@/lib/superbase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PollsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This redirect will happen on the server.
    // The middleware should catch this first, but this is a fallback.
    redirect("/login");
  }

  const polls = await prisma.poll.findMany({
    include: {
      creator: true,
    },
  });

  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-bold mb-4">All Polls</h1>
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} user={user} />
      ))}
    </div>
  );
}
