-- Create movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  backdrop_url TEXT,
  release_date DATE,
  overview TEXT,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  genres TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  score DECIMAL(3,2),
  source TEXT DEFAULT 'bookmyshow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create movie_sentiments table for aggregated data
CREATE TABLE IF NOT EXISTS public.movie_sentiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE UNIQUE,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_score DECIMAL(3,2),
  overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_sentiments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Movies are viewable by everyone"
  ON public.movies FOR SELECT
  USING (true);

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Movie sentiments are viewable by everyone"
  ON public.movie_sentiments FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_movies_tmdb_id ON public.movies(tmdb_id);
CREATE INDEX idx_reviews_movie_id ON public.reviews(movie_id);
CREATE INDEX idx_movie_sentiments_movie_id ON public.movie_sentiments(movie_id);
CREATE INDEX idx_movies_release_date ON public.movies(release_date DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for movies
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for movie_sentiments
CREATE TRIGGER update_movie_sentiments_updated_at
  BEFORE UPDATE ON public.movie_sentiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update sentiment aggregates
CREATE OR REPLACE FUNCTION public.update_movie_sentiment_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.movie_sentiments (
    movie_id,
    positive_count,
    negative_count,
    neutral_count,
    total_reviews,
    average_score,
    overall_sentiment
  )
  SELECT
    NEW.movie_id,
    COUNT(*) FILTER (WHERE sentiment = 'positive'),
    COUNT(*) FILTER (WHERE sentiment = 'negative'),
    COUNT(*) FILTER (WHERE sentiment = 'neutral'),
    COUNT(*),
    AVG(score),
    CASE
      WHEN COUNT(*) FILTER (WHERE sentiment = 'positive') > COUNT(*) FILTER (WHERE sentiment = 'negative')
        AND COUNT(*) FILTER (WHERE sentiment = 'positive') > COUNT(*) FILTER (WHERE sentiment = 'neutral')
        THEN 'positive'
      WHEN COUNT(*) FILTER (WHERE sentiment = 'negative') > COUNT(*) FILTER (WHERE sentiment = 'positive')
        AND COUNT(*) FILTER (WHERE sentiment = 'negative') > COUNT(*) FILTER (WHERE sentiment = 'neutral')
        THEN 'negative'
      ELSE 'neutral'
    END
  FROM public.reviews
  WHERE movie_id = NEW.movie_id
  ON CONFLICT (movie_id) DO UPDATE
  SET
    positive_count = EXCLUDED.positive_count,
    negative_count = EXCLUDED.negative_count,
    neutral_count = EXCLUDED.neutral_count,
    total_reviews = EXCLUDED.total_reviews,
    average_score = EXCLUDED.average_score,
    overall_sentiment = EXCLUDED.overall_sentiment,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update sentiment aggregates when reviews change
CREATE TRIGGER update_sentiment_aggregates
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_movie_sentiment_aggregates();