import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PollVoting } from "@/components/poll-voting";
import { PollShare } from "@/components/poll-share";
import { getPollWithVotes, getUserVote } from "@/lib/actions";
// import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { Metadata } from "next";

/**
 * Builds page metadata for a poll detail page using the poll ID.
 *
 * Fetches poll data (including options and total votes) and returns SEO and social metadata:
 * - If the poll is missing, returns a fallback title and description indicating "Poll Not Found".
 * - If the poll exists, returns a title, description, and Open Graph/Twitter card fields populated
 *   from the poll question, a short list of up to three options, and the current total votes.
 *
 * @param params - Route params containing the poll `id`.
 * @returns A Metadata object suitable for Next.js page metadata (openGraph and twitter included).
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const pollData = await getPollWithVotes(params.id);

  if (!pollData) {
    return {
      title: "Poll Not Found",
      description: "The requested poll could not be found.",
    };
  }

  const options = pollData.options as string[];
  const optionsText = options.slice(0, 3).join(", ");
  const moreOptions =
    options.length > 3 ? ` and ${options.length - 3} more` : "";

  return {
    title: `${pollData.question} - Polling App`,
    description: `Vote on: ${pollData.question}. Options include: ${optionsText}${moreOptions}. ${pollData.totalVotes} votes so far.`,
    openGraph: {
      title: pollData.question,
      description: `Join the poll! Options: ${optionsText}${moreOptions}`,
      type: "website",
      siteName: "Polling App",
    },
    twitter: {
      card: "summary",
      title: pollData.question,
      description: `Vote now! Options: ${optionsText}${moreOptions}`,
    },
  };
}

/**
 * Renders the poll detail page for a given poll id.
 *
 * Fetches poll data and the current user's vote, returns a server-rendered UI that shows
 * the poll question, creator and creation date, voting interface/results, statistics,
 * additional poll info, and sharing controls. If the poll cannot be found, this function
 * triggers a 404 via `notFound()`.
 *
 * @param params - Route params object.
 * @param params.id - The poll identifier to load.
 */
export default async function PollDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const pollData = await getPollWithVotes(params.id);

  if (!pollData) {
    notFound();
  }

  const userVote = await getUserVote(params.id);
  const hasVoted = !!userVote;

  const options = pollData.options as string[];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Poll Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  {pollData.question}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Created by {pollData.creator.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created{" "}
                      {new Date(pollData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${hasVoted ? "border-transparent bg-primary text-primary-foreground" : "border-transparent bg-secondary text-secondary-foreground"}`}
              >
                {hasVoted ? "Voted" : "Not Voted"}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Voting Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {hasVoted ? "Your Vote & Results" : "Cast Your Vote"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PollVoting
              pollId={pollData.id}
              options={options}
              voteCounts={pollData.voteCounts}
              totalVotes={pollData.totalVotes}
              hasVoted={hasVoted}
              userVote={userVote || undefined}
            />
          </CardContent>
        </Card>

        {/* Poll Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {pollData.totalVotes}
                </div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {options.length}
                </div>
                <div className="text-sm text-muted-foreground">Options</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.max(...Object.values(pollData.voteCounts))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Highest Votes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    (Date.now() - new Date(pollData.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Days Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Poll ID:</span>
              <span className="font-mono text-xs">{pollData.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(pollData.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Poll Sharing */}
        <PollShare pollId={pollData.id} pollQuestion={pollData.question} />
      </div>
    </div>
  );
}
