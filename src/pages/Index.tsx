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
          <h2 className="text-3xl font-bold text-foreground mb-2">Latest Indian Cinema Releases</h2>
          <p className="text-muted-foreground">Automated sentiment analysis from BookMyShow reviews • Updated Day 1 of release</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockMovies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-12 mt-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Reviews sourced from BookMyShow • Automated Day 1 updates
            </p>
            <p className="text-foreground font-semibold">
              Developed by <span className="text-accent">MANOHAR</span>
            </p>
            <p className="text-muted-foreground text-xs">
              © 2024 CineSentiment. All rights reserved. This platform is designed for sentiment analysis of Indian cinema reviews.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
