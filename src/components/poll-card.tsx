"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "./ui/button";
import { deletePoll } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PollCard({
  poll,
  user,
}: {
  poll: { id: string; question: string; creatorId: string };
  user: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isCreator = poll.creatorId === user.id;

  const handleDelete = async () => {
    setLoading(true);
    const result = await deletePoll(poll.id);
    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <Card>
      <Link href={`/polls/${poll.id}`}>
        <div className="hover:shadow-md transition">
          <CardHeader>
            <h2 className="font-semibold">{poll.question}</h2>
          </CardHeader>
          <CardContent>
            <p>votes</p>
          </CardContent>
        </div>
      </Link>
      {isCreator && (
        <CardContent className="flex gap-2">
          <Link href={`/polls/${poll.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your poll and all its votes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button onClick={handleDelete}>
                  {loading ? "Loading..." : "Continue"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      )}
    </Card>
  );
}
