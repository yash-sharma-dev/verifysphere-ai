import { ThumbsUp, ThumbsDown, MessageSquare, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CommunityFeedbackProps {
  upvotes: number;
  downvotes: number;
  comments: number;
}

export const CommunityFeedback = ({ upvotes, downvotes, comments }: CommunityFeedbackProps) => {
  const total = upvotes + downvotes;
  const percentage = total > 0 ? (upvotes / total) * 100 : 50;

  return (
    <Card className="w-full max-w-3xl mx-auto p-6 shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Community Consensus</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-true">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-semibold">{upvotes} agree</span>
            </span>
            <span className="text-muted-foreground">{total} votes</span>
            <span className="flex items-center gap-2 text-false">
              <span className="font-semibold">{downvotes} disagree</span>
              <ThumbsDown className="h-4 w-4" />
            </span>
          </div>
          
          <Progress value={percentage} className="h-2" />
          
          <p className="text-xs text-center text-muted-foreground">
            {percentage.toFixed(0)}% of the community finds this credible
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2">
            <ThumbsUp className="h-4 w-4" />
            Agree
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <ThumbsDown className="h-4 w-4" />
            Disagree
          </Button>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{comments}</span>
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Help the community:</strong> Vote based on evidence, not opinion. 
            Add sources in comments to improve credibility assessment.
          </p>
        </div>
      </div>
    </Card>
  );
};
