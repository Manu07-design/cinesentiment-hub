import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviews } = await req.json();
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Reviews array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${reviews.length} reviews...`);

    // Combine reviews for batch analysis
    const reviewsText = reviews.map((r: string, i: number) => `Review ${i + 1}: ${r}`).join('\n\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are a sentiment analysis expert for Indian cinema (Bollywood, Tollywood, Sandalwood) movie reviews from BookMyShow. 
Analyze reviews and determine overall sentiment as: positive, negative, or neutral.

Guidelines:
- Positive: Reviews praising acting, story, direction, music, entertainment value
- Negative: Reviews criticizing poor execution, weak story, bad acting, waste of time/money
- Neutral: Mixed reviews, moderate opinions, or balanced criticism and praise

Return the overall sentiment and a confidence score (0-100) based on review consensus.`
          },
          {
            role: 'user',
            content: `Analyze these BookMyShow reviews and provide overall sentiment:\n\n${reviewsText}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_sentiment',
              description: 'Analyze movie reviews and return sentiment classification',
              parameters: {
                type: 'object',
                properties: {
                  sentiment: {
                    type: 'string',
                    enum: ['positive', 'negative', 'neutral'],
                    description: 'Overall sentiment classification'
                  },
                  score: {
                    type: 'number',
                    description: 'Confidence score from 0-100'
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief summary of why this sentiment was determined (max 100 words)'
                  }
                },
                required: ['sentiment', 'score', 'summary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_sentiment' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'analyze_sentiment') {
      console.error('No valid tool call in response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Sentiment analysis result:', result);

    return new Response(
      JSON.stringify({
        sentiment: result.sentiment,
        score: Math.round(result.score),
        summary: result.summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-sentiment function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
