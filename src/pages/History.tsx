import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, ExternalLink, Trash2, Clock } from "lucide-react";
import { getVerificationHistory } from "@/lib/verificationService";
import { CredibilityScore } from "@/components/CredibilityScore";
import { formatDistanceToNow } from "date-fns";

interface HistoryEntry {
  id: string;
  input: string;
  type: 'url' | 'text' | 'image';
  result: {
    score: number;
    level: 'true' | 'mostly-true' | 'uncertain' | 'mostly-false' | 'false';
    title: string;
  };
  timestamp: string;
}

const History = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      const entries = getVerificationHistory();
      setHistory(entries);
    };
    loadHistory();
    // Refresh every 5 seconds in case history changes
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id: string) => {
    const entries = getVerificationHistory();
    const filtered = entries.filter((entry: HistoryEntry) => entry.id !== id);
    localStorage.setItem("verificationHistory", JSON.stringify(filtered));
    setHistory(filtered);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      localStorage.removeItem("verificationHistory");
      setHistory([]);
    }
  };

  const getTypeIcon = (type: 'url' | 'text' | 'image') => {
    switch (type) {
      case 'url':
        return <ExternalLink className="h-4 w-4" />;
      case 'text':
        return <span className="text-xs">T</span>;
      case 'image':
        return <span className="text-xs">IMG</span>;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'true':
      case 'mostly-true':
        return 'bg-true/10 text-true border-true/20';
      case 'false':
      case 'mostly-false':
        return 'bg-false/10 text-false border-false/20';
      default:
        return 'bg-uncertain/10 text-uncertain border-uncertain/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Verification History</h1>
              <p className="text-muted-foreground">
                View your past verification results
              </p>
            </div>
            {history.length > 0 && (
              <Button variant="outline" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <Card className="p-12 text-center">
              <HistoryIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">No verification history</CardTitle>
              <CardDescription className="mb-6">
                Start verifying content to see your history here
              </CardDescription>
              <Button asChild>
                <Link to="/">Verify Content</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="gap-1">
                            {getTypeIcon(entry.type)}
                            {entry.type.toUpperCase()}
                          </Badge>
                          <Badge className={getLevelColor(entry.result.level)}>
                            {entry.result.level.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mb-1 line-clamp-2">
                          {entry.type === 'image' 
                            ? 'Image Verification' 
                            : entry.input.length > 100 
                            ? entry.input.substring(0, 100) + '...'
                            : entry.input}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <CredibilityScore
                        score={entry.result.score}
                        level={entry.result.level}
                        title={entry.result.title}
                      />
                    </div>
                    {entry.type === 'url' && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={entry.input} target="_blank" rel="noopener noreferrer" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Open URL
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;

