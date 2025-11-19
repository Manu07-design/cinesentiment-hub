import { HeroSection } from "@/components/HeroSection";
import { MovieCard } from "@/components/MovieCard";
import { mockMovies } from "@/data/mockMovies";
import { Film } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold text-foreground">CineSentiment</span>
          </div>
        </div>
      </nav>

      <HeroSection />

      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">Latest Movies</h2>
          <p className="text-muted-foreground">Real-time sentiment analysis from thousands of reviews</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockMovies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 CineSentiment. AI-powered movie review analysis.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
