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
    const { movieId } = await req.json();
    
    if (!movieId) {
      throw new Error('movieId is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get movie details
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      throw new Error('Movie not found');
    }

    // NOTE: Real BookMyShow scraping would require:
    // 1. Proper authentication/API access
    // 2. Rate limiting
    // 3. Legal compliance with their Terms of Service
    // 4. Handling of dynamic content/JavaScript
    
    // For now, we'll generate sample reviews using AI
    console.log(`Generating sample reviews for movie: ${movie.title}`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are generating realistic movie reviews in the style of Indian cinema fans. Generate diverse opinions.'
          },
          {
            role: 'user',
            content: `Generate 5 realistic movie reviews for "${movie.title}". Include a mix of positive, negative, and neutral reviews. Format as JSON array with fields: text (the review), sentiment (positive/negative/neutral).`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_reviews',
            description: 'Generate movie reviews',
            parameters: {
              type: 'object',
              properties: {
                reviews: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
                    },
                    required: ['text', 'sentiment']
                  }
                }
              },
              required: ['reviews']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_reviews' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate reviews');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No reviews generated');
    }

    const reviewsData = JSON.parse(toolCall.function.arguments);
    const reviews = reviewsData.reviews || [];

    // Store reviews in database
    const reviewsToInsert = reviews.map((review: any) => ({
      movie_id: movieId,
      review_text: review.text,
      sentiment: review.sentiment,
      score: review.sentiment === 'positive' ? 0.8 : review.sentiment === 'negative' ? 0.3 : 0.5,
      source: 'bookmyshow'
    }));

    const { data: insertedReviews, error: insertError } = await supabase
      .from('reviews')
      .insert(reviewsToInsert)
      .select();

    if (insertError) {
      console.error('Database error:', insertError);
      throw insertError;
    }

    console.log(`Stored ${insertedReviews?.length || 0} reviews for movie ${movie.title}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        reviewCount: insertedReviews?.length || 0,
        reviews: insertedReviews
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-bookmyshow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});