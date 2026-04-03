import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in base64 chars
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";
}

async function checkRateLimit(ip: string, functionName: string): Promise<boolean> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.from("rate_limits").select("id, request_count, window_start").eq("ip", ip).eq("function_name", functionName).single();
    if (data) {
      if (new Date(data.window_start).getTime() < Date.now() - RATE_LIMIT_WINDOW_MS) {
        await supabase.from("rate_limits").update({ request_count: 1, window_start: new Date().toISOString() }).eq("id", data.id);
        return true;
      }
      if (data.request_count >= RATE_LIMIT_MAX) return false;
      await supabase.from("rate_limits").update({ request_count: data.request_count + 1 }).eq("id", data.id);
      return true;
    }
    await supabase.from("rate_limits").insert({ ip, function_name: functionName, request_count: 1 });
    return true;
  } catch (e) {
    console.error("Rate limit check failed:", e);
    return true;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side size validation
    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_IMAGE_SIZE) {
      return new Response(JSON.stringify({ error: "Image too large. Maximum size is 10MB." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate mime type
    const allowedMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const safeMime = allowedMimes.includes(mimeType) ? mimeType : "image/png";

    // Rate limiting
    const clientIp = getClientIp(req);
    const allowed = await checkRateLimit(clientIp, "ocr-error");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL text from this screenshot of a programming error. Return ONLY the raw error text exactly as it appears, including stack traces, file paths, and line numbers. Do not add any explanation or commentary.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${safeMime};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: extractedText.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-error error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
