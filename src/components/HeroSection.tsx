import { Sparkles } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="w-12 h-12 text-accent animate-pulse" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 text-foreground">
          Indian Cinema <span className="text-primary">Sentiment</span> Analyzer
        </h1>
        <p className="text-xl md:text-2xl text-center text-muted-foreground max-w-3xl mx-auto">
          AI-powered sentiment analysis of Bollywood, Tollywood & Sandalwood movies using real BookMyShow reviews
        </p>
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="px-6 py-3 bg-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-accent">🎬 Bollywood</div>
          </div>
          <div className="px-6 py-3 bg-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-accent">🎭 Tollywood</div>
          </div>
          <div className="px-6 py-3 bg-secondary rounded-lg border border-border">
            <div className="text-lg font-bold text-accent">🎪 Sandalwood</div>
          </div>
        </div>
        <div className="flex justify-center gap-8 mt-12 text-center">
          <div>
            <div className="text-4xl font-bold text-accent">1000+</div>
            <div className="text-sm text-muted-foreground">Movies Analyzed</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-4xl font-bold text-accent">BookMyShow</div>
            <div className="text-sm text-muted-foreground">Reviews Integration</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-4xl font-bold text-accent">Day 1</div>
            <div className="text-sm text-muted-foreground">Auto Updates</div>
          </div>
        </div>
      </div>
    </section>
  );
};
