import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CONTENT_LENGTH = 5_000;
const MAX_NAME_LENGTH = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { debugId, authorName, content } = await req.json();
    if (!debugId || !content) {
      return new Response(JSON.stringify({ error: "Missing debugId or content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    if (typeof debugId !== "string" || debugId.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid debugId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof content !== "string" || content.length > MAX_CONTENT_LENGTH) {
      return new Response(JSON.stringify({ error: "Content too large. Maximum 5,000 characters." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = typeof authorName === "string" ? authorName.slice(0, MAX_NAME_LENGTH) : "Anonymous";

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data, error } = await supabase
      .from("debug_comments")
      .insert({ debug_id: debugId, author_name: safeName, content: content.slice(0, MAX_CONTENT_LENGTH) })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("add-debug-comment error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
