import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function PollDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  // placeholder data
  const poll = {
    id,
    question: "Which frontend framework do you prefer?",
    options: ["React", "Vue", "Svelte", "Angular"],
    votes: [20, 15, 10, 5],
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">{poll.question}</h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {poll.options.map((opt, i) => (
              <li
                key={i}
                className="flex justify-between border p-2 rounded-md hover:bg-muted/50"
              >
                <span>{opt}</span>
                <span>{poll.votes[i]} votes</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
