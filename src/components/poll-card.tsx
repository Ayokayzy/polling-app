import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PollCard({
  poll,
}: {
  poll: { id: number; question: string; votes: number };
}) {
  return (
    <Link href={`/polls/${poll.id}`}>
      <Card className="hover:shadow-md transition">
        <CardHeader>
          <h2 className="font-semibold">{poll.question}</h2>
        </CardHeader>
        <CardContent>
          <p>{poll.votes} votes</p>
        </CardContent>
      </Card>
    </Link>
  );
}
