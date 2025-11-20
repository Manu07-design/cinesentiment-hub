import { useEffect, useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { MovieCard } from "@/components/MovieCard";
import { SentimentDemo } from "@/components/SentimentDemo";
import { SearchBar } from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { Film, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  release_date: string | null;
  overview: string | null;
}

interface MovieWithSentiment extends Movie {
  sentiment?: string;
  score?: number;
  reviewCount?: number;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MovieWithSentiment[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<MovieWithSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);

      // Fetch movies with their sentiments
      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select(`
          *,
          movie_sentiments (
            overall_sentiment,
            average_score,
            total_reviews
          )
        `)
        .order('release_date', { ascending: false })
        .limit(20);

      if (moviesError) throw moviesError;

      const moviesWithSentiment = moviesData?.map(movie => ({
        id: movie.id,
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_url: movie.poster_url,
        release_date: movie.release_date,
        overview: movie.overview,
        sentiment: movie.movie_sentiments?.overall_sentiment || 'neutral',
        score: movie.movie_sentiments?.average_score || 0,
        reviewCount: movie.movie_sentiments?.total_reviews || 0,
      })) || [];

      setMovies(moviesWithSentiment);
      setFilteredMovies(moviesWithSentiment);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast({
        title: "Error",
        description: "Failed to load movies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredMovies(movies);
      return;
    }

    const filtered = movies.filter(movie =>
      movie.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMovies(filtered);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Call edge function to fetch new movies from TMDB
      const { data, error } = await supabase.functions.invoke('fetch-tmdb-movies');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${data.count} movies from TMDB`,
      });

      // Refresh the movies list
      await fetchMovies();
    } catch (error) {
      console.error('Error refreshing movies:', error);
      toast({
        title: "Error",
        description: "Failed to refresh movies",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleMovieClick = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

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

      <SentimentDemo />

      <section className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Latest Indian Cinema Releases</h2>
              <p className="text-muted-foreground">Automated sentiment analysis from BookMyShow reviews • Updated Day 1 of release</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh Movies'}
            </Button>
          </div>

          <SearchBar onSearch={handleSearch} />
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading movies...</div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No movies found. Try refreshing to fetch movies from TMDB.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <div key={movie.id} onClick={() => handleMovieClick(movie.id)} className="cursor-pointer">
                <MovieCard
                  title={movie.title}
                  poster={movie.poster_url || ''}
                  sentiment={movie.sentiment as 'positive' | 'negative' | 'neutral'}
                  score={movie.score || 0}
                  releaseDate={movie.release_date || ''}
                  reviewCount={movie.reviewCount || 0}
                />
              </div>
            ))}
          </div>
        )}
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
