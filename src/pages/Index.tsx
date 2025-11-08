import { useState } from "react";
import { Header } from "@/components/Header";
import { VerificationInput } from "@/components/VerificationInput";
import { CredibilityScore } from "@/components/CredibilityScore";
import { VerificationReport } from "@/components/VerificationReport";
import { CommunityFeedback } from "@/components/CommunityFeedback";
import { Shield, Zap, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

// Mock data for demonstration
const mockVerificationData = {
  score: 75,
  level: 'mostly-true' as const,
  title: 'Climate Change Impact on Global Temperature',
  explanation: 'Our AI analysis, cross-referenced with 15 verified scientific sources, indicates this claim is largely accurate. The content aligns with peer-reviewed research from reputable institutions including NASA, NOAA, and the IPCC. While some specific statistics vary slightly across sources, the core claim is well-supported by scientific consensus.',
  evidence: [
    {
      type: 'supporting' as const,
      title: 'NASA Climate Study Confirms Rising Temperatures',
      source: 'NASA Climate Research',
      url: 'https://climate.nasa.gov',
      excerpt: 'Multiple independent datasets show Earth\'s average surface temperature has risen approximately 1.1°C since pre-industrial times, consistent with the claim...',
    },
    {
      type: 'supporting' as const,
      title: 'IPCC Sixth Assessment Report',
      source: 'Intergovernmental Panel on Climate Change',
      url: 'https://ipcc.ch',
      excerpt: 'The report confirms with high confidence that human activities have caused global warming of approximately 1.0°C above pre-industrial levels...',
    },
    {
      type: 'neutral' as const,
      title: 'Natural Climate Variability Research',
      source: 'Journal of Climate Science',
      url: 'https://journals.ametsoc.org',
      excerpt: 'While natural variability exists, the study notes that observed warming cannot be explained by natural factors alone...',
    },
  ],
  community: {
    upvotes: 1247,
    downvotes: 189,
    comments: 342,
  },
};

const Index = () => {
  const [showResults, setShowResults] = useState(false);

  const handleVerify = (input: string, type: 'url' | 'text' | 'image') => {
    console.log('Verifying:', type, input);
    // Simulate API call
    setTimeout(() => {
      setShowResults(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {!showResults ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-16 space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="h-4 w-4" />
                AI-Powered News Verification
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
                Fight Misinformation with{" "}
                <span className="text-primary">FakeCheck</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Verify news credibility in seconds using advanced AI, trusted sources, 
                and community consensus. Make informed decisions with confidence.
              </p>
            </div>

            {/* Verification Input */}
            <div className="mb-16">
              <VerificationInput onVerify={handleVerify} />
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Instant Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get credibility scores in seconds using advanced AI and machine learning
                </p>
              </Card>

              <Card className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground">Trusted Sources</h3>
                <p className="text-sm text-muted-foreground">
                  Cross-referenced with verified news outlets and fact-checking databases
                </p>
              </Card>

              <Card className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Community Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Benefit from collective intelligence and community-verified information
                </p>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Verification Results */}
            <div className="space-y-6">
              <CredibilityScore
                score={mockVerificationData.score}
                level={mockVerificationData.level}
                title={mockVerificationData.title}
              />

              <VerificationReport
                explanation={mockVerificationData.explanation}
                evidence={mockVerificationData.evidence}
              />

              <CommunityFeedback
                upvotes={mockVerificationData.community.upvotes}
                downvotes={mockVerificationData.community.downvotes}
                comments={mockVerificationData.community.comments}
              />

              <div className="flex justify-center">
                <button
                  onClick={() => setShowResults(false)}
                  className="text-primary hover:underline font-medium"
                >
                  ← Verify Another
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 FakeCheck. Fighting misinformation through technology and community.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
