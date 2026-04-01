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

  if (inputMode === "bugreport") {
    return `You are a QA expert that generates structured bug reports from error messages, logs, or failure descriptions. Analyze the provided input and return a JSON object with these fields:
${baseFields}
- "bugTitle": A concise, descriptive bug title
- "description": Detailed description of the bug (2-4 sentences)
- "stepsToReproduce": Array of 3-6 step-by-step reproduction instructions
- "expectedResult": What should have happened
- "actualResult": What actually happened
- "possibleRootCause": Brief explanation of the likely root cause
- "severity": One of "Low", "Medium", "High", "Critical"
- "severityReason": Why this severity was assigned (1 sentence)
- "priority": One of "Low", "Medium", "High"
- "priorityReason": Why this priority was assigned (1 sentence)
- "environment": Detected environment details (OS, browser, runtime, etc.) or "Unknown"
- "additionalNotes": Any extra observations or context (1-2 sentences)

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "testcase") {
    return `You are a QA test case generation expert. Based on the provided feature description, module name, or code, generate comprehensive test cases. Return a JSON object with these fields:
${baseFields}
- "summary": Brief summary of what is being tested
- "testCases": Array of 6-10 test cases, each: { "id": string (e.g. "TC-001"), "type": "positive"|"negative"|"edge", "scenario": string, "steps": array of strings, "expectedResult": string, "priority": "Low"|"Medium"|"High" }
- "coverageSummary": Object with { "positiveCount": number, "negativeCount": number, "edgeCaseCount": number, "totalCount": number }

${levelInstruction}
${langInstruction}
Respond ONLY with valid JSON, no markdown fences.`;
  }

  if (inputMode === "testscenario") {
    return `You are a QA scenario planning expert. Given a feature or module name, generate comprehensive test scenarios covering all angles. Return a JSON object with these fields:
${baseFields}
- "featureName": The feature or module being tested
- "summary": Brief overview of testing scope
- "functionalScenarios": Array of 3-5 functional test scenarios (strings describing what to test)
- "edgeCaseScenarios": Array of 3-5 edge case scenarios (strings)
- "negativeScenarios": Array of 3-5 negative test scenarios (strings)
- "securityScenarios": Array of 2-3 security-related test scenarios (strings)
- "performanceScenarios": Array of 2-3 performance-related scenarios (strings)
- "recommendations": Array of 2-3 general QA recommendations

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

  return `You are an expert AI software debugging and code repair agent. Your job is to diagnose complex programming errors and generate safe, minimal fixes.

Follow this debugging workflow:
1. ERROR IDENTIFICATION: Determine the programming language, framework, environment. Classify the error type (runtime, syntax, dependency, API, config, database, build, deploy).
2. STACK TRACE ANALYSIS: Identify the failing file, function, line number, and execution path. Distinguish between framework internals and user code.
3. ROOT CAUSE ANALYSIS: Explain why the error occurs, what triggered it, which code/config is responsible. Be concise and technical.
4. CODE CONTEXT ANALYSIS: Analyze imports, detect incorrect API usage, async/await issues, state bugs, missing env vars, schema mismatches. Identify the minimal set of files responsible.
5. LOG & RUNTIME ANALYSIS: If logs are provided, correlate timestamps, detect cascading failures, summarize critical signals.
6. GENERATE FIXES: Provide 2-3 solutions ranked by confidence with trade-offs. Prefer root cause fixes over workarounds.
7. CORRECTED CODE: Generate minimal corrected code preserving project structure and style.
8. PATCH DIFF: Generate a Git-style unified diff showing exact changes.
9. PR DRAFT: Generate a ready-to-use pull request with title, root cause, fix explanation, files modified, steps to reproduce and verify.
10. DEBUGGING CHECKLIST: Provide steps to confirm the fix works.

${terminalInstruction}${codeInstruction}

Respond with a JSON object containing exactly these fields:
${baseFields}
- "difficulty": Error difficulty level - one of "Easy", "Medium", "Advanced"
- "difficultyExplanation": A short one-sentence explanation of why this difficulty level was assigned
- "explanation": A clear explanation of what the error/issue means (2-4 sentences). Include the root cause, what condition triggered it, and which part of the code is responsible.
- "causes": An array of 2-4 root causes ranked by likelihood, each explaining why the error occurs and what condition triggers it
- "fixes": An array of 2-3 fix objects ranked by confidence, each with: { "title": string, "description": string (include trade-offs and when to use this fix), "code": string (corrected code snippet) }
- "correctedCode": A complete corrected code example that fixes the primary issue with minimal changes
- "problemLines": If source code was provided, an array of line numbers where issues were detected (empty array otherwise)
${inputMode === "terminal" ? '- "extractedError": The main error extracted from the terminal log' : ""}
- "resources": An array of 2-4 objects with { "title": string, "url": string, "type": "stackoverflow" | "docs" | "article" } — relevant links
- "learningConcept": An object with { "title": string (the concept name), "explanation": string (2-3 sentences explaining the concept), "example": string (a short code example demonstrating the concept), "bestPractices": array of 2-3 strings (best practices to avoid this error) }
- "bugWarnings": Array of 0-4 potential future bug warnings detected in the code. Each object: { "type": string, "description": string, "severity": "low"|"medium"|"high", "line": number or null }
- "dependencyFix": If the error is dependency-related, an object with { "detected": true, "packageName": string, "installCommands": object with keys like "npm", "pip" etc. mapping to install command strings, "explanation": string }. If not dependency-related, { "detected": false }.
${inputMode === "terminal" ? '- "stackTraceAnalysis": An object with { "rootCauseFile": string, "problemLine": number or string, "reason": string, "suggestedFix": string }' : ""}
- "errorCategory": One of "Syntax Error", "Runtime Error", "Dependency Error", "API Error", "Security Issue", "Logic Error", "Type Error", "Configuration Error"
- "executionPath": Array of 3-6 strings describing the execution path that leads to the error (e.g. ["Request received at /api/auth", "JWT validation called", "Token expired check failed", "Error thrown at line 42"])
- "affectedFiles": Array of 1-4 objects identifying files involved: { "file": string (file path), "line": number or null, "role": string (e.g. "origin of bug", "cascading failure", "missing import") }
- "debugChecklist": Array of 4-6 step-by-step debugging/verification steps (strings) developers can follow to confirm the fix works
- "debugSimulation": Array of 3-6 simulation steps showing how the error occurs, each: { "step": number, "description": string, "state": string }
- "patchDiff": A Git-style unified diff string showing the exact change needed. Use standard diff format with --- a/file and +++ b/file headers, @@ line markers, lines prefixed with - for removed and + for added.
- "pullRequestSuggestion": An object with { "title": string (conventional commit style, e.g. "fix: resolve null pointer in auth module"), "description": string (markdown body with sections: ## Root Cause, ## Fix Applied, ## Files Modified, ## Steps to Reproduce, ## Steps to Verify) }

IMPORTANT RULES:
- Always prioritize minimal, safe fixes over rewrites.
- Do not remove working logic unnecessarily.
- Prefer root cause fixes instead of temporary workarounds.
- Follow best practices for the detected framework or language.
- If the root cause is uncertain, present multiple hypotheses ranked by likelihood.

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
      bugreport: "Generate a structured bug report from this error/failure:",
      testcase: "Generate test cases for this feature/module/code:",
      testscenario: "Generate test scenarios for this feature/module:",
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
