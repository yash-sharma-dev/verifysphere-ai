import { useState, useRef } from "react";
import { Search, Link as LinkIcon, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface VerificationInputProps {
  onVerify: (input: string, type: 'url' | 'text' | 'image') => void;
  isVerifying?: boolean;
}

export const VerificationInput = ({ onVerify, isVerifying = false }: VerificationInputProps) => {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'image'>('url');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = () => {
    if (input.trim() || imagePreview) {
      onVerify(input || imagePreview || "", activeTab);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please upload an image file",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Image size should be less than 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setInput(result); // Store data URL for verification
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (value: string) => {
    const newTab = value as 'url' | 'text' | 'image';
    setActiveTab(newTab);
    // Clear image preview when switching away from image tab
    if (newTab !== 'image' && imagePreview) {
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    // Clear input when switching to image tab
    if (newTab === 'image' && input && !imagePreview) {
      setInput("");
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6 shadow-lg">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Verify News Content</h2>
          <p className="text-muted-foreground">Enter a URL, paste text, or upload an image to check credibility</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
            {imagePreview ? (
              <div className="relative border-2 border-border rounded-lg p-4">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-64 mx-auto rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload a screenshot or image to verify</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleVerify} 
          className="w-full gap-2 h-12 text-base font-semibold"
          disabled={(!input.trim() && !imagePreview) || isVerifying}
        >
          <Search className="h-5 w-5" />
          {isVerifying ? "Verifying..." : "Verify Now"}
        </Button>
      </div>
    </Card>
  );
};
