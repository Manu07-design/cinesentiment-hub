import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    const TMDB_API_TOKEN = Deno.env.get('TMDB_API_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TMDB_API_KEY || !TMDB_API_TOKEN) {
      throw new Error('TMDB API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch now playing movies from India (region=IN)
    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&region=IN&language=en-US&page=1`,
      {
        headers: {
          'Authorization': `Bearer ${TMDB_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!tmdbResponse.ok) {
      console.error('TMDB API error:', await tmdbResponse.text());
      throw new Error('Failed to fetch movies from TMDB');
    }

    const tmdbData = await tmdbResponse.json();
    console.log(`Fetched ${tmdbData.results?.length || 0} movies from TMDB`);

    // Process and store movies
    const movies = tmdbData.results?.map((movie: any) => ({
      tmdb_id: movie.id,
      title: movie.title,
      poster_url: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      backdrop_url: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null,
      release_date: movie.release_date || null,
      overview: movie.overview || '',
      vote_average: movie.vote_average || 0,
      vote_count: movie.vote_count || 0,
      genres: [], // Would need another API call to get full genre names
    })) || [];

    // Upsert movies into database
    if (movies.length > 0) {
      const { data, error } = await supabase
        .from('movies')
        .upsert(movies, { 
          onConflict: 'tmdb_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log(`Stored ${data?.length || 0} movies in database`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: data?.length || 0,
          movies: data 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, count: 0, movies: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-tmdb-movies:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});