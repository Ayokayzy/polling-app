import { createClient } from "@/lib/superbase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditPollForm } from "@/components/edit-poll-form";

export default async function EditPollPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const poll = await prisma.poll.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!poll || poll.creatorId !== user.id) {
    redirect("/polls");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}
