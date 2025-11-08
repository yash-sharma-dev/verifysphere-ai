import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface CommunityFeedbackProps {
  upvotes: number;
  downvotes: number;
  comments: number;
  verificationId?: string;
}

export const CommunityFeedback = ({ upvotes, downvotes, comments, verificationId }: CommunityFeedbackProps) => {
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    // Load user's vote from localStorage
    if (verificationId) {
      const vote = localStorage.getItem(`vote_${verificationId}`);
      if (vote === 'up' || vote === 'down') {
        setUserVote(vote);
      }
    }
  }, [verificationId]);

  const total = localUpvotes + localDownvotes;
  const percentage = total > 0 ? (localUpvotes / total) * 100 : 50;

  const handleVote = (type: 'up' | 'down') => {
    if (!verificationId) {
      toast.info("Unable to save vote without verification ID");
      return;
    }

    const storageKey = `vote_${verificationId}`;
    const previousVote = localStorage.getItem(storageKey);

    if (previousVote === type) {
      // Remove vote
      localStorage.removeItem(storageKey);
      setUserVote(null);
      if (type === 'up') {
        setLocalUpvotes(prev => Math.max(0, prev - 1));
      } else {
        setLocalDownvotes(prev => Math.max(0, prev - 1));
      }
      toast.success("Vote removed");
    } else {
      // Add or change vote
      if (previousVote === 'up') {
        setLocalUpvotes(prev => Math.max(0, prev - 1));
      } else if (previousVote === 'down') {
        setLocalDownvotes(prev => Math.max(0, prev - 1));
      }

      localStorage.setItem(storageKey, type);
      setUserVote(type);
      
      if (type === 'up') {
        setLocalUpvotes(prev => prev + 1);
        toast.success("Thanks for your feedback!");
      } else {
        setLocalDownvotes(prev => prev + 1);
        toast.success("Thanks for your feedback!");
      }
    }
  };

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
              <span className="font-semibold">{localUpvotes} agree</span>
            </span>
            <span className="text-muted-foreground">{total} votes</span>
            <span className="flex items-center gap-2 text-false">
              <span className="font-semibold">{localDownvotes} disagree</span>
              <ThumbsDown className="h-4 w-4" />
            </span>
          </div>
          
          <Progress value={percentage} className="h-2" />
          
          <p className="text-xs text-center text-muted-foreground">
            {percentage.toFixed(0)}% of the community finds this credible
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant={userVote === 'up' ? "default" : "outline"} 
            className="flex-1 gap-2"
            onClick={() => handleVote('up')}
          >
            <ThumbsUp className="h-4 w-4" />
            Agree
          </Button>
          <Button 
            variant={userVote === 'down' ? "default" : "outline"} 
            className="flex-1 gap-2"
            onClick={() => handleVote('down')}
          >
            <ThumbsDown className="h-4 w-4" />
            Disagree
          </Button>
          <Button variant="outline" className="gap-2" disabled>
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
