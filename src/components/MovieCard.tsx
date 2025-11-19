import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MovieCardProps {
  title: string;
  poster: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  releaseDate: string;
  reviewCount: number;
}

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

export const MovieCard = ({ title, poster, sentiment, score, releaseDate, reviewCount }: MovieCardProps) => {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <Card className="group overflow-hidden border-border bg-card hover:shadow-[var(--shadow-glow)] transition-all duration-300 cursor-pointer">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={poster} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Badge className={`absolute top-3 right-3 ${config.color} flex items-center gap-1`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-foreground line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{releaseDate}</span>
          <span className="text-accent font-semibold">{score}%</span>
        </div>
        <p className="text-xs text-muted-foreground">{reviewCount} reviews analyzed</p>
      </div>
    </Card>
  );
};
