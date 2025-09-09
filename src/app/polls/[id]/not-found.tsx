import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Poll Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The poll you're looking for doesn't exist or may have been deleted.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild>
              <Link href="/polls">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Polls
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/polls/new">Create New Poll</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
