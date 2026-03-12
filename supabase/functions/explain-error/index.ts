import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPrompt(inputMode: string, explanationMode: string): string {
  const levelInstruction = explanationMode === "expert"
    ? "Use technical language, reference specifications, internals, and advanced concepts. Assume the reader is an experienced developer."
    : "Use simple, beginner-friendly language. Avoid jargon. Explain concepts as if teaching someone new to programming.";

  if (inputMode === "review") {
    return `You are an expert code reviewer. Analyze the provided code and return a JSON object with these fields:
- "language": Detected programming language
- "framework": Detected framework (e.g. "React", "Express", "Django", "Spring Boot", "Laravel", "Next.js", "Node.js") or "None"
- "qualitySuggestions": Array of 2-4 code quality improvement suggestions
- "performanceImprovements": Array of 2-4 performance improvement suggestions  
- "bestPractices": Array of 2-4 best practice recommendations
- "improvedCode": The improved version of the code
- "summary": A brief summary of the review
- "bugWarnings": Array of 0-4 potential future bug warnings. Each object: { "type": string (e.g. "memory_leak", "null_pointer", "inefficient_loop", "unsafe_practice"), "description": string, "severity": "low"|"medium"|"high", "line": number or null }
- "commitMessage": A conventional commit message for the improvements (e.g. "refactor: improve error handling and add input validation")

${levelInstruction}

Respond ONLY with valid JSON, no markdown fences.`;
  }

  const terminalInstruction = inputMode === "terminal"
    ? `The user has pasted a full terminal log. First, extract the MAIN error from the log, ignoring noise/warnings/info lines. Focus on the most relevant error line and stack trace. Then analyze that extracted error.`
    : "";

  const codeInstruction = inputMode === "code"
    ? `The user has pasted source code (not just an error message). Analyze the code, detect potential bugs, problematic patterns, or errors. Identify the specific lines that could cause issues.`
    : "";

  return `You are an expert programming error analyzer and debugger. ${terminalInstruction}${codeInstruction}

When given input, respond with a JSON object containing exactly these fields:
- "language": The detected programming language (e.g. "JavaScript", "Python", "Java", "TypeScript", "C++", "Go", "Rust", "Ruby", "PHP", "C#"). If unknown, use "Unknown".
- "framework": Detected framework (e.g. "React", "Express", "Django", "Spring Boot", "Laravel", "Next.js", "Node.js", "Flask", "Vue.js", "Angular") or "None"
- "difficulty": Error difficulty level - one of "Easy", "Medium", "Advanced"
- "difficultyExplanation": A short one-sentence explanation of why this difficulty level was assigned
- "explanation": A clear explanation of what the error/issue means (2-4 sentences)
- "causes": An array of 2-4 common causes for this error/issue
- "fixes": An array of 2-3 fix objects, each with: { "title": string, "description": string, "code": string (optional code example) }
- "correctedCode": A complete corrected code example that fixes the primary issue
- "problemLines": If source code was provided, an array of line numbers where issues were detected (empty array otherwise)
${inputMode === "terminal" ? '- "extractedError": The main error extracted from the terminal log' : ""}
- "resources": An array of 2-4 objects with { "title": string, "url": string, "type": "stackoverflow" | "docs" | "article" } — relevant links
- "learningConcept": An object with { "title": string (the concept name), "explanation": string (2-3 sentences explaining the concept), "example": string (a short code example demonstrating the concept), "bestPractices": array of 2-3 strings (best practices to avoid this error) }
- "commitMessage": A conventional commit message for the fix (e.g. "fix: resolve null pointer exception in authentication module")
- "bugWarnings": Array of 0-4 potential future bug warnings detected in the code. Each object: { "type": string (e.g. "memory_leak", "null_pointer", "inefficient_loop", "unsafe_practice"), "description": string, "severity": "low"|"medium"|"high", "line": number or null }
- "dependencyFix": If the error is dependency-related (missing module, version conflict, package issue), an object with { "detected": true, "packageName": string, "installCommands": object with keys like "npm", "pip", "composer" etc. mapping to install command strings, "explanation": string }. If not dependency-related, { "detected": false }.
${inputMode === "terminal" ? '- "stackTraceAnalysis": An object with { "rootCauseFile": string (file where the error originates), "problemLine": number or string, "reason": string, "suggestedFix": string }' : ""}

${levelInstruction}

Respond ONLY with valid JSON, no markdown fences.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { errorMessage, inputMode = "error", explanationMode = "beginner" } = body;
    
    if (!errorMessage || typeof errorMessage !== "string") {
      return new Response(JSON.stringify({ error: "Please provide an error message or code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildPrompt(inputMode, explanationMode);
    
    const userPromptPrefix = {
      error: "Explain this error:",
      code: "Analyze this code for bugs and issues:",
      terminal: "Extract the main error from this terminal output and explain it:",
      review: "Review this code and suggest improvements:",
    }[inputMode as string] || "Explain this error:";

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
          { role: "user", content: `${userPromptPrefix}\n\n${errorMessage}` },
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
      return new Response(JSON.stringify({ error: "AI service error" }), {
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
      parsed = {
        language: "Unknown",
        framework: "None",
        difficulty: "Medium",
        difficultyExplanation: "",
        explanation: content,
        causes: [],
        fixes: [],
        correctedCode: "",
        resources: [],
        learningConcept: null,
        commitMessage: "",
        bugWarnings: [],
        dependencyFix: { detected: false },
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explain-error error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
