import { CreatePollForm } from "@/components/create-poll-form";

export default function NewPollPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Poll</h1>
      <CreatePollForm />
    </div>
  );
}
