import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const sentimentConfig = {
  positive: {
    icon: TrendingUp,
    color: "bg-positive text-positive-foreground",
    label: "Positive"
  },
  negative: {
    icon: TrendingDown,
    color: "bg-negative text-negative-foreground",
    label: "Negative"
  },
  neutral: {
    icon: Minus,
    color: "bg-neutral text-neutral-foreground",
    label: "Neutral"
  }
};

export const SentimentDemo = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState(`Great movie! Loved the action sequences and performances.
The story was weak but visuals were stunning.
Complete waste of time and money. Poor direction.
Amazing cinematography and background score!
Average movie, nothing special.`);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    summary: string;
  } | null>(null);

  const analyzeSentiment = async () => {
    if (!reviews.trim()) {
      toast({
        title: "Error",
        description: "Please enter some reviews to analyze",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      // Split reviews by newline
      const reviewArray = reviews
        .split('\n')
        .filter(r => r.trim().length > 0);

      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { reviews: reviewArray }
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: "Analysis Complete",
        description: `Sentiment: ${data.sentiment} (${data.score}% confidence)`,
      });

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze sentiment",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-accent" />
            <h2 className="text-3xl font-bold text-foreground">Try AI Sentiment Analysis</h2>
          </div>
          <p className="text-muted-foreground">
            Enter BookMyShow reviews (one per line) and see our AI analyze the sentiment in real-time
          </p>
        </div>

        <Card className="p-6 bg-card border-border space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Movie Reviews (one per line)
            </label>
            <Textarea
              value={reviews}
              onChange={(e) => setReviews(e.target.value)}
              placeholder="Enter reviews, one per line..."
              className="min-h-[200px] bg-secondary border-border text-foreground"
            />
          </div>

          <Button
            onClick={analyzeSentiment}
            disabled={analyzing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Sentiment
              </>
            )}
          </Button>

          {result && (
            <Card className="p-6 bg-secondary border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Analysis Result</h3>
                <Badge className={sentimentConfig[result.sentiment].color}>
                  {(() => {
                    const Icon = sentimentConfig[result.sentiment].icon;
                    return <Icon className="w-4 h-4 mr-1" />;
                  })()}
                  {sentimentConfig[result.sentiment].label}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Confidence Score:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                    <span className="text-accent font-bold text-sm">{result.score}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Summary:</span>
                  <p className="text-foreground mt-1">{result.summary}</p>
                </div>
              </div>
            </Card>
          )}
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Powered by Lovable AI • Real-time sentiment analysis for Indian cinema</p>
        </div>
      </div>
    </section>
  );
};
