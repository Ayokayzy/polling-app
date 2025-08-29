import { PollCard } from "@/components/poll-card"

export default function PollsPage() {
  const polls = [
    { id: 1, question: "Best programming language?", votes: 120 },
    { id: 2, question: "Frontend vs Backend?", votes: 80 },
  ]

  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-bold mb-4">All Polls</h1>
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  )
}
