import { useState } from "react";
import { Search, Link as LinkIcon, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface VerificationInputProps {
  onVerify: (input: string, type: 'url' | 'text' | 'image') => void;
}

export const VerificationInput = ({ onVerify }: VerificationInputProps) => {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'image'>('url');

  const handleVerify = () => {
    if (input.trim()) {
      onVerify(input, activeTab);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6 shadow-lg">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Verify News Content</h2>
          <p className="text-muted-foreground">Enter a URL, paste text, or upload an image to check credibility</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <Textarea
              placeholder="https://example.com/news-article"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="Paste the news content or claim you want to verify..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[150px]"
            />
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Upload a screenshot or image to verify</p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleVerify} 
          className="w-full gap-2 h-12 text-base font-semibold"
          disabled={!input.trim()}
        >
          <Search className="h-5 w-5" />
          Verify Now
        </Button>
      </div>
    </Card>
  );
};
