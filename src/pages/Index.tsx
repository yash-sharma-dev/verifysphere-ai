    import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { VerificationInput } from "@/components/VerificationInput";
import { CredibilityScore } from "@/components/CredibilityScore";
import { VerificationReport } from "@/components/VerificationReport";
import { CommunityFeedback } from "@/components/CommunityFeedback";
import { Shield, Zap, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { verifyContent, saveVerificationToHistory, type VerificationResult } from "@/lib/verificationService";
import { toast } from "sonner";

const Index = () => {
  const location = useLocation();
  const [showResults, setShowResults] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationResult | null>(null);

  // Reset verification results when navigating to home page
  useEffect(() => {
    // Reset state when location changes to home page or when reset state is present
    if (location.pathname === "/") {
      const resetState = (location.state as { reset?: number })?.reset;
      if (resetState) {
        setShowResults(false);
        setVerificationData(null);
      }
    }
  }, [location.pathname, location.state]);

  const handleVerify = async (input: string, type: 'url' | 'text' | 'image') => {
    if (!input || (!input.trim() && type !== 'image')) {
      toast.error("Please enter content to verify");
      return;
    }
    
    if (type === 'image' && !input.startsWith('data:image/')) {
      toast.error("Please upload a valid image");
      return;
    }

    setIsVerifying(true);
    setShowResults(false);

    try {
      const result = await verifyContent(input, type);
      // Ensure score is a number
      const normalizedResult = {
        ...result,
        score: typeof result.score === 'number' ? result.score : parseInt(result.score, 10) || 0
      };
      console.log('Verification result:', normalizedResult);
      setVerificationData(normalizedResult);
      saveVerificationToHistory(input, type, normalizedResult);
      setShowResults(true);
      toast.success("Verification complete!", {
        description: `Credibility score: ${normalizedResult.score}%`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Verification failed", {
        description: errorMessage,
      });
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
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
                <span className="text-primary">VerifySphere</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Verify news credibility in seconds using advanced AI, trusted sources, 
                and community consensus. Make informed decisions with confidence.
              </p>
            </div>

            {/* Verification Input */}
            <div className="mb-16">
              <VerificationInput onVerify={handleVerify} isVerifying={isVerifying} />
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
        ) : verificationData ? (
          <>
            {/* Verification Results */}
            <div className="space-y-6">
              <CredibilityScore
                score={verificationData.score}
                level={verificationData.level}
                title={verificationData.title}
              />

              <VerificationReport
                explanation={verificationData.explanation}
                evidence={verificationData.evidence}
              />

              <CommunityFeedback
                upvotes={verificationData.community.upvotes}
                downvotes={verificationData.community.downvotes}
                comments={verificationData.community.comments}
                verificationId={verificationData.title}
              />

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setVerificationData(null);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  ← Verify Another
                </button>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 VerifySphere. Fighting misinformation through technology and community.</p>
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
