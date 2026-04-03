import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CODE_LENGTH = 30_000;
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
    const { code, language } = await req.json();
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input size validation
    if (code.length > MAX_CODE_LENGTH) {
      return new Response(JSON.stringify({ error: "Code too large. Please limit to 30,000 characters." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const clientIp = getClientIp(req);
    const allowed = await checkRateLimit(clientIp, "generate-tests");
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

    const systemPrompt = `You are an expert test engineer. Generate comprehensive unit tests for the provided code.

Use the appropriate testing framework based on the detected language:
- JavaScript/TypeScript: Jest
- Python: PyTest
- Java: JUnit 5
- C#: xUnit or NUnit
- Go: testing package
- Rust: built-in test module
- Ruby: RSpec
- PHP: PHPUnit

Generate 3-5 test cases covering:
- Happy path / normal usage
- Edge cases
- Error handling

Return a JSON object with:
- "framework": The testing framework used (e.g. "Jest", "PyTest", "JUnit 5")
- "testCode": The complete test code as a string
- "testDescriptions": Array of strings describing each test case

Respond ONLY with valid JSON, no markdown fences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate unit tests for this ${language || ""} code:\n\n${code}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
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
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const cleaned = content.replace(/^```json?\s*\n?/, "").replace(/\n?```\s*$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { framework: "Unknown", testCode: content, testDescriptions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-tests error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
