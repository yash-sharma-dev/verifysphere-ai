import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type CredibilityLevel = 'true' | 'mostly-true' | 'uncertain' | 'mostly-false' | 'false';

interface CredibilityScoreProps {
  score: number;
  level: CredibilityLevel;
  title: string;
}

const levelConfig = {
  'true': {
    icon: CheckCircle,
    label: 'Likely True',
    color: 'bg-true',
    textColor: 'text-true',
    borderColor: 'border-true',
  },
  'mostly-true': {
    icon: CheckCircle,
    label: 'Mostly True',
    color: 'bg-true',
    textColor: 'text-true',
    borderColor: 'border-true',
  },
  'uncertain': {
    icon: AlertCircle,
    label: 'Uncertain',
    color: 'bg-uncertain',
    textColor: 'text-uncertain',
    borderColor: 'border-uncertain',
  },
  'mostly-false': {
    icon: XCircle,
    label: 'Mostly False',
    color: 'bg-false',
    textColor: 'text-false',
    borderColor: 'border-false',
  },
  'false': {
    icon: XCircle,
    label: 'Likely False',
    color: 'bg-false',
    textColor: 'text-false',
    borderColor: 'border-false',
  },
};

export const CredibilityScore = ({ score, level, title }: CredibilityScoreProps) => {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <Card className={`w-full max-w-3xl mx-auto p-8 border-2 ${config.borderColor} shadow-lg`}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${config.color}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <Badge className={`${config.color} text-white mb-2`}>
              {config.label}
            </Badge>
            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Credibility Score</span>
            <span className={`font-bold ${config.textColor}`}>{score}%</span>
          </div>
          <Progress value={score} className="h-3" />
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            This score is based on AI analysis, source verification, and community feedback. 
            Always cross-reference with multiple sources.
          </p>
        </div>
      </div>
    </Card>
  );
};
