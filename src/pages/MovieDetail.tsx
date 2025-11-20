import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average: number;
  vote_count: number;
}

interface MovieSentiment {
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_reviews: number;
  average_score: number;
  overall_sentiment: string;
}

interface Review {
  id: string;
  review_text: string;
  sentiment: string;
  score: number;
  created_at: string;
}

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [sentiment, setSentiment] = useState<MovieSentiment | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieData();
  }, [id]);

  const fetchMovieData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch movie
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (movieError) throw movieError;
      setMovie(movieData);

      // Fetch sentiment
      const { data: sentimentData } = await supabase
        .from('movie_sentiments')
        .select('*')
        .eq('movie_id', id)
        .single();

      if (sentimentData) setSentiment(sentimentData);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('movie_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData) setReviews(reviewsData);

    } catch (error) {
      console.error('Error fetching movie:', error);
      toast({
        title: "Error",
        description: "Failed to load movie details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'negative': return <ThumbsDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Movie not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="relative h-[50vh] bg-cover bg-center"
        style={{ backgroundImage: movie.backdrop_url ? `url(${movie.backdrop_url})` : 'none' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="absolute top-4 left-4 z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full md:w-64 rounded-lg shadow-2xl"
              />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-4">{movie.title}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              {movie.release_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span>{movie.vote_average.toFixed(1)} ({movie.vote_count} votes)</span>
              </div>
            </div>

            {sentiment && (
              <Card className="p-6 mb-6 bg-card">
                <h2 className="text-2xl font-bold text-foreground mb-4">Sentiment Analysis</h2>
                <div className="flex items-center gap-2 mb-4">
                  {getSentimentIcon(sentiment.overall_sentiment)}
                  <span className="text-lg font-semibold capitalize text-foreground">
                    {sentiment.overall_sentiment}
                  </span>
                  <span className="text-muted-foreground">
                    ({sentiment.total_reviews} reviews)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{sentiment.positive_count}</div>
                    <div className="text-sm text-muted-foreground">Positive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{sentiment.neutral_count}</div>
                    <div className="text-sm text-muted-foreground">Neutral</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{sentiment.negative_count}</div>
                    <div className="text-sm text-muted-foreground">Negative</div>
                  </div>
                </div>
              </Card>
            )}

            {movie.overview && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {reviews.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Recent Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4 bg-card">
                      <div className="flex items-start gap-3">
                        {getSentimentIcon(review.sentiment)}
                        <div className="flex-1">
                          <p className="text-foreground">{review.review_text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;