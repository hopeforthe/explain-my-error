import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPrompt(inputMode: string, explanationMode: string, outputLanguage: string): string {
  const levelInstruction = explanationMode === "expert"
    ? "Use technical language, reference specifications, internals, and advanced concepts. Assume the reader is an experienced developer."
    : "Use simple, beginner-friendly language. Avoid jargon. Explain concepts as if teaching someone new to programming.";

  const langInstruction = outputLanguage && outputLanguage !== "en"
    ? `IMPORTANT: Write ALL explanations, descriptions, suggestions, and text content in ${
        { hi: "Hindi", te: "Telugu", es: "Spanish", zh: "Chinese (Simplified)", fr: "French", de: "German", ja: "Japanese", ko: "Korean", pt: "Portuguese", ar: "Arabic" }[outputLanguage] || "English"
      }. Keep code examples, variable names, and technical terms in English.`
    : "";

  const baseFields = `
- "language": Detected programming language
- "framework": Detected framework (e.g. "React", "Express", "Django", "Spring Boot", "Laravel", "Next.js", "Node.js") or "None"
- "commitMessage": A conventional commit message for the fix/improvement`;

  if (inputMode === "review") {
    return `You are an expert code reviewer. Analyze the provided code and return a JSON object with these fields:
${baseFields}
- "qualitySuggestions": Array of 2-4 code quality improvement suggestions
- "performanceImprovements": Array of 2-4 performance improvement suggestions  
- "bestPractices": Array of 2-4 best practice recommendations
- "improvedCode": The improved version of the code
- "summary": A brief summary of the review
- "bugWarnings": Array of 0-4 potential future bug warnings. Each object: { "type": string, "description": string, "severity": "low"|"medium"|"high", "line": number or null }

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "refactor") {
    return `You are an expert code refactoring specialist. Analyze the provided code and return a JSON object with these fields:
${baseFields}
- "summary": Brief summary of refactoring changes
- "qualitySuggestions": Array of 3-5 refactoring suggestions (cleaner structure, better naming, reduced complexity)
- "bestPractices": Array of 2-4 best practice recommendations
- "improvedCode": The refactored version of the code
- "bugWarnings": Array of 0-3 potential issues. Each: { "type": string, "description": string, "severity": "low"|"medium"|"high", "line": number or null }
- "complexityAnalysis": Object with { "before": string (e.g. "High"), "after": string (e.g. "Low"), "explanation": string }

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "security") {
    return `You are a security vulnerability scanner for source code. Analyze the provided code and return a JSON object with these fields:
${baseFields}
- "summary": Brief security assessment summary
- "vulnerabilities": Array of 0-6 security issues found. Each: { "type": string (e.g. "SQL Injection", "XSS", "Exposed Secrets"), "severity": "low"|"medium"|"high"|"critical", "line": number or null, "description": string, "fix": string, "cwe": string (CWE ID if applicable) }
- "securityScore": number 0-100 (100 = most secure)
- "recommendations": Array of 2-4 general security recommendations
- "improvedCode": Secured version of the code

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "performance") {
    return `You are a performance optimization expert. Analyze the provided code for performance issues and return a JSON object with these fields:
${baseFields}
- "summary": Brief performance assessment
- "issues": Array of 2-5 performance issues found. Each: { "type": string (e.g. "Inefficient Loop", "N+1 Query", "Memory Leak"), "severity": "low"|"medium"|"high", "line": number or null, "description": string, "fix": string, "impact": string }
- "performanceScore": number 0-100 (100 = best performance)
- "complexityAnalysis": Object with { "timeComplexity": string, "spaceComplexity": string, "explanation": string }
- "improvedCode": Optimized version of the code
- "recommendations": Array of 2-4 general performance tips

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "explain") {
    return `You are a code explainer. Analyze the provided code and return a JSON object with these fields:
${baseFields}
- "summary": Brief overview of what the code does
- "lineExplanations": Array of objects, each: { "lines": string (e.g. "1-3"), "code": string (the actual code), "explanation": string }
- "keyConceptsCovered": Array of 2-4 programming concepts used in the code
- "flowDescription": A step-by-step description of the code's execution flow (array of strings)

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "sql") {
    return `You are an SQL and database expert. Analyze the provided SQL query or database error and return a JSON object with these fields:
${baseFields}
- "explanation": What the query does or what the error means
- "syntaxErrors": Array of syntax errors found (each: { "description": string, "fix": string })
- "performanceIssues": Array of performance problems (each: { "issue": string, "suggestion": string, "impact": "low"|"medium"|"high" })
- "correctedCode": The corrected/optimized SQL query
- "queryPlan": Brief explanation of how the query would execute
- "recommendations": Array of 2-4 best practice tips

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "api") {
    return `You are an API debugging expert. Analyze the provided API error response, curl command, or HTTP error and return a JSON object with these fields:
${baseFields}
- "statusCode": The HTTP status code (number or null)
- "statusMeaning": What the status code means
- "explanation": Detailed explanation of the API error
- "causes": Array of 2-4 possible causes
- "headerIssues": Array of potential header problems (strings)
- "parameterIssues": Array of potential parameter/body problems (strings)
- "fixes": Array of 2-3 fix objects, each: { "title": string, "description": string, "code": string }
- "correctedCode": A corrected API request example
- "curlExample": A working curl command example

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "log") {
    return `You are a log file analysis expert. Analyze the provided log output and return a JSON object with these fields:
${baseFields}
- "summary": Brief summary of what the logs show
- "criticalErrors": Array of critical errors found (each: { "message": string, "timestamp": string or null, "source": string or null, "explanation": string })
- "warnings": Array of warning messages (each: { "message": string, "significance": string })
- "rootCause": Object with { "description": string, "evidence": string, "suggestedFix": string }
- "timeline": Array of event objects showing the sequence: { "time": string or null, "event": string, "severity": "info"|"warning"|"error"|"critical" }
- "recommendations": Array of 2-4 actionable fixes

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "cicd") {
    return `You are a CI/CD pipeline debugging expert. Analyze the provided CI/CD error log (GitHub Actions, Docker, Jenkins, etc.) and return a JSON object with these fields:
${baseFields}
- "platform": Detected CI/CD platform (e.g. "GitHub Actions", "Docker", "Jenkins", "GitLab CI")
- "explanation": What failed and why
- "failedStep": The specific step that failed
- "causes": Array of 2-4 possible causes
- "fixes": Array of 2-3 fix objects, each: { "title": string, "description": string, "code": string }
- "correctedCode": Corrected pipeline configuration or command
- "environmentIssues": Array of environment-related problems found (strings)

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "deploy") {
    return `You are a deployment debugging expert. Analyze the provided deployment error log (Vercel, Netlify, AWS, Docker, etc.) and return a JSON object with these fields:
${baseFields}
- "platform": Detected deployment platform
- "explanation": What failed and why
- "failedStep": The specific deployment step that failed
- "causes": Array of 2-4 possible causes
- "fixes": Array of 2-3 fix objects, each: { "title": string, "description": string, "code": string }
- "correctedCode": Corrected configuration or fix
- "environmentIssues": Array of environment/config issues (strings)
- "checklist": Array of 3-5 deployment verification steps

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "docs") {
    return `You are a documentation generator. Analyze the provided code and generate documentation. Return a JSON object with these fields:
${baseFields}
- "summary": Brief overview of the code
- "functionDocs": Array of function docs, each: { "name": string, "description": string, "params": array of { "name": string, "type": string, "description": string }, "returns": string, "example": string }
- "readme": A complete README section in markdown format
- "usageExamples": Array of 2-3 usage example strings (code)
- "apiDocs": If applicable, API documentation in markdown

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "diff") {
    return `You are a code diff analyzer. The user will provide two versions of code separated by "--- OLD CODE ---" and "--- NEW CODE ---". Analyze the differences and return a JSON object with these fields:
${baseFields}
- "summary": Brief summary of changes
- "changes": Array of changes found, each: { "type": "added"|"removed"|"modified", "description": string, "oldCode": string or null, "newCode": string or null, "line": number or null }
- "bugIntroduced": boolean - whether the changes introduce a bug
- "bugExplanation": If a bug was introduced, explain it (string or null)
- "suggestions": Array of 2-3 improvement suggestions
- "correctedCode": If bugs found, the corrected new version

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "reproduce") {
    return `You are a bug reproduction expert. Analyze the provided buggy code and generate a minimal reproducible example. Return a JSON object with these fields:
${baseFields}
- "explanation": What the bug is
- "rootCause": The root cause of the bug
- "minimalExample": A minimal code example that reproduces the bug
- "expectedBehavior": What the code should do
- "actualBehavior": What the code actually does
- "debugSteps": Array of 3-5 step-by-step debugging instructions
- "correctedCode": The fixed version

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "complexity") {
    return `You are a code complexity analyzer. Analyze the provided code and return a JSON object with these fields:
${baseFields}
- "summary": Brief complexity assessment
- "cyclomaticComplexity": number (estimated)
- "maintainabilityScore": number 0-100 (100 = most maintainable)
- "codeQuality": "Excellent"|"Good"|"Fair"|"Poor"
- "metrics": Object with { "linesOfCode": number, "functionCount": number, "nestingDepth": number, "cognitiveComplexity": number }
- "hotspots": Array of complex areas, each: { "location": string, "complexity": "low"|"medium"|"high", "suggestion": string }
- "simplificationSuggestions": Array of 2-4 suggestions to reduce complexity
- "improvedCode": Simplified version of the code

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "env") {
    return `You are an environment setup and dependency debugging expert. Analyze the provided error message or configuration and return a JSON object with these fields:
${baseFields}
- "explanation": What the environment issue is
- "causes": Array of 2-4 possible causes
- "platform": Detected platform/runtime (e.g. "Node.js", "Python", "Docker")
- "versionIssues": Array of version-related problems, each: { "package": string, "currentVersion": string or null, "requiredVersion": string, "fix": string }
- "missingDependencies": Array of missing packages with install commands
- "fixes": Array of 2-3 fix objects, each: { "title": string, "description": string, "code": string }
- "setupChecklist": Array of 3-5 environment verification steps

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "migrate") {
    return `You are a code migration expert. Analyze the provided code and the migration target specified by the user. Return a JSON object with these fields:
${baseFields}
- "summary": Brief migration assessment
- "sourceVersion": Detected source version/framework
- "targetVersion": The migration target
- "breakingChanges": Array of breaking changes, each: { "description": string, "oldSyntax": string, "newSyntax": string }
- "migrationSteps": Array of step-by-step migration instructions (strings)
- "improvedCode": The migrated code
- "warnings": Array of potential issues after migration
- "deprecations": Array of deprecated features used

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "interview") {
    return `You are a technical interview preparation assistant. Based on the provided code or error, generate interview-style content. Return a JSON object with these fields:
${baseFields}
- "topic": The main programming topic/concept
- "conceptExplanation": Clear explanation of the concept (2-3 sentences)
- "questions": Array of 3-5 interview questions, each: { "question": string, "difficulty": "easy"|"medium"|"hard", "answer": string, "followUp": string }
- "keyTakeaways": Array of 3-4 important points to remember
- "commonMistakes": Array of 2-3 common mistakes developers make

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  // Default: error, code, terminal modes
  const terminalInstruction = inputMode === "terminal"
    ? `The user has pasted a full terminal log. First, extract the MAIN error from the log, ignoring noise/warnings/info lines. Focus on the most relevant error line and stack trace. Then analyze that extracted error.`
    : "";

  const codeInstruction = inputMode === "code"
    ? `The user has pasted source code (not just an error message). Analyze the code, detect potential bugs, problematic patterns, or errors. Identify the specific lines that could cause issues.`
    : "";

  return `You are an expert programming error analyzer and debugger. ${terminalInstruction}${codeInstruction}

When given input, respond with a JSON object containing exactly these fields:
${baseFields}
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
- "bugWarnings": Array of 0-4 potential future bug warnings detected in the code. Each object: { "type": string, "description": string, "severity": "low"|"medium"|"high", "line": number or null }
- "dependencyFix": If the error is dependency-related, an object with { "detected": true, "packageName": string, "installCommands": object with keys like "npm", "pip" etc. mapping to install command strings, "explanation": string }. If not dependency-related, { "detected": false }.
${inputMode === "terminal" ? '- "stackTraceAnalysis": An object with { "rootCauseFile": string, "problemLine": number or string, "reason": string, "suggestedFix": string }' : ""}
- "errorCategory": One of "Syntax Error", "Runtime Error", "Dependency Error", "API Error", "Security Issue", "Logic Error", "Type Error", "Configuration Error"
- "debugChecklist": Array of 4-6 step-by-step debugging steps (strings)
- "debugSimulation": Array of 3-6 simulation steps showing how the error occurs, each: { "step": number, "description": string, "state": string }

${levelInstruction}
${langInstruction}

Respond ONLY with valid JSON, no markdown fences.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { errorMessage, inputMode = "error", explanationMode = "beginner", outputLanguage = "en" } = body;
    
    if (!errorMessage || typeof errorMessage !== "string") {
      return new Response(JSON.stringify({ error: "Please provide an error message or code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildPrompt(inputMode, explanationMode, outputLanguage);
    
    const userPromptPrefixes: Record<string, string> = {
      error: "Explain this error:",
      code: "Analyze this code for bugs and issues:",
      terminal: "Extract the main error from this terminal output and explain it:",
      review: "Review this code and suggest improvements:",
      refactor: "Refactor this code for better quality:",
      security: "Scan this code for security vulnerabilities:",
      performance: "Analyze this code for performance issues:",
      explain: "Explain this code line by line:",
      sql: "Analyze this SQL query/error:",
      api: "Debug this API error/request:",
      log: "Analyze this log output:",
      cicd: "Debug this CI/CD pipeline error:",
      deploy: "Debug this deployment error:",
      docs: "Generate documentation for this code:",
      diff: "Analyze the differences between these code versions:",
      reproduce: "Create a minimal reproducible example for this bug:",
      complexity: "Analyze the complexity of this code:",
      env: "Debug this environment/setup issue:",
      migrate: "Migrate this code to a newer version:",
      interview: "Generate interview questions based on this code/concept:",
    };

    const userPromptPrefix = userPromptPrefixes[inputMode] || "Explain this error:";

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
