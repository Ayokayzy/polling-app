"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitVote } from "@/lib/actions";
import { toast } from "sonner";
import { CheckCircle, Circle, AlertCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface PollVotingProps {
  pollId: string;
  options: string[];
  voteCounts: Record<string, number>;
  totalVotes: number;
  hasVoted: boolean;
  userVote?: string;
}

export function PollVoting({
  pollId,
  options,
  voteCounts,
  totalVotes,
  hasVoted: initialHasVoted,
  userVote: initialUserVote,
}: PollVotingProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticVoteCounts, setOptimisticVoteCounts] = useState(voteCounts);
  const [optimisticTotalVotes, setOptimisticTotalVotes] = useState(totalVotes);
  const router = useRouter();

  const handleVote = () => {
    if (!selectedOption) return;

    setError(null);

    // Optimistic update
    const newVoteCounts = { ...optimisticVoteCounts };
    newVoteCounts[selectedOption] = (newVoteCounts[selectedOption] || 0) + 1;
    setOptimisticVoteCounts(newVoteCounts);
    setOptimisticTotalVotes(optimisticTotalVotes + 1);
    setHasVoted(true);
    setUserVote(selectedOption);

    startTransition(async () => {
      try {
        const result = await submitVote(pollId, selectedOption);

        if (result.success) {
          toast.success(result.message);
        } else {
          // Revert optimistic update on failure
          setOptimisticVoteCounts(voteCounts);
          setOptimisticTotalVotes(totalVotes);
          setHasVoted(false);
          setUserVote(undefined);
          setError(result.message);
          toast.error(result.message);
        }
      } catch (err) {
        // Revert optimistic update on error
        setOptimisticVoteCounts(voteCounts);
        setOptimisticTotalVotes(totalVotes);
        setHasVoted(false);
        setUserVote(undefined);
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Poll results refreshed!");
    }, 1000);
  };

  const getPercentage = (option: string) => {
    if (optimisticTotalVotes === 0) return 0;
    return Math.round(
      (optimisticVoteCounts[option] / optimisticTotalVotes) * 100,
    );
  };

  const getBarWidth = (option: string) => {
    if (optimisticTotalVotes === 0) return "0%";
    return `${getPercentage(option)}%`;
  };

  if (options.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No voting options available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Voting Interface (only shown if user hasn't voted) */}
      {!hasVoted && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Cast your vote:</h3>
          <div className="space-y-2">
            {options.map((option) => (
              <Card
                key={option}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedOption === option
                    ? "ring-2 ring-primary bg-muted/50"
                    : ""
                }`}
                onClick={() => setSelectedOption(option)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  {selectedOption === option ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="flex-1">{option}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            onClick={handleVote}
            disabled={!selectedOption || isPending}
            className="w-full"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Submitting...
              </div>
            ) : (
              "Submit Vote"
            )}
          </Button>
        </div>
      )}

      {/* Results (always shown, but more prominent after voting) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Results:</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {optimisticTotalVotes}{" "}
              {optimisticTotalVotes === 1 ? "vote" : "votes"}
              {isPending && hasVoted && (
                <span className="ml-1 text-xs text-primary">(updating...)</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isPending}
              className="h-6 w-6 p-0"
            >
              <RotateCcw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {options.map((option) => {
            const percentage = getPercentage(option);
            const votes = optimisticVoteCounts[option];
            const isUserChoice = hasVoted && userVote === option;

            return (
              <div
                key={option}
                className={`relative overflow-hidden rounded-lg border p-4 transition-all duration-300 ${
                  isUserChoice ? "ring-2 ring-primary bg-primary/5" : ""
                } ${isPending && isUserChoice ? "opacity-75" : ""}`}
              >
                {/* Progress bar background */}
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-700 ease-out"
                  style={{ width: getBarWidth(option) }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option}</span>
                    {isUserChoice && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{percentage}%</span>
                    <span className="text-muted-foreground">
                      ({votes} {votes === 1 ? "vote" : "votes"})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
