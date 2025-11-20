-- Fix search_path security warning for update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for movies
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate trigger for movie_sentiments
CREATE TRIGGER update_movie_sentiments_updated_at
  BEFORE UPDATE ON public.movie_sentiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix search_path security warning for update_movie_sentiment_aggregates
DROP FUNCTION IF EXISTS public.update_movie_sentiment_aggregates() CASCADE;
CREATE OR REPLACE FUNCTION public.update_movie_sentiment_aggregates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate trigger to update sentiment aggregates when reviews change
CREATE TRIGGER update_sentiment_aggregates
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_movie_sentiment_aggregates();