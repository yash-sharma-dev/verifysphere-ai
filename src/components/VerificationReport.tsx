import { ExternalLink, Check, X, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Evidence {
  type: 'supporting' | 'contradicting' | 'neutral';
  title: string;
  source: string;
  url: string;
  excerpt: string;
}

interface VerificationReportProps {
  explanation: string;
  evidence: Evidence[];
}

const evidenceConfig = {
  supporting: {
    icon: Check,
    label: 'Supporting',
    color: 'bg-true/10 text-true border-true/20',
  },
  contradicting: {
    icon: X,
    label: 'Contradicting',
    color: 'bg-false/10 text-false border-false/20',
  },
  neutral: {
    icon: AlertTriangle,
    label: 'Neutral',
    color: 'bg-uncertain/10 text-uncertain border-uncertain/20',
  },
};

export const VerificationReport = ({ explanation, evidence }: VerificationReportProps) => {
  return (
    <Card className="w-full max-w-3xl mx-auto p-6 shadow-lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 text-foreground">Verification Report</h3>
          <p className="text-muted-foreground leading-relaxed">{explanation}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Related Evidence & Sources</h4>
          
          <div className="space-y-3">
            {evidence.map((item, idx) => {
              const config = evidenceConfig[item.type];
              const Icon = config.icon;
              
              return (
                <Card key={idx} className={`p-4 border ${config.color}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <Badge variant="outline" className="mb-1 text-xs">
                            {config.label}
                          </Badge>
                          <h5 className="font-medium text-sm text-foreground">{item.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1">{item.source}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                    
                    <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        View Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
