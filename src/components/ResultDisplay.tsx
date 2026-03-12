import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Zap,
  Code,
  Lightbulb,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Wand2,
  Share2,
  Shield,
  Layers,
  Star,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Volume2,
  VolumeX,
  GitCommit,
  TestTube,
  Loader2,
  Package,
  Bug,
  FileWarning,
  FileCode,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Resource {
  title: string;
  url: string;
  type: "stackoverflow" | "docs" | "article";
}

interface FixOption {
  title: string;
  description: string;
  code?: string;
}

interface LearningConcept {
  title: string;
  explanation: string;
  example: string;
  bestPractices: string[];
}

interface BugWarning {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
  line: number | null;
}

interface DependencyFix {
  detected: boolean;
  packageName?: string;
  installCommands?: Record<string, string>;
  explanation?: string;
}

interface StackTraceAnalysis {
  rootCauseFile: string;
  problemLine: number | string;
  reason: string;
  suggestedFix: string;
}

export interface ExplanationResult {
  language: string;
  framework?: string;
  difficulty?: string;
  difficultyExplanation?: string;
  explanation: string;
  causes: string[];
  fixes: string[] | FixOption[];
  correctedCode: string;
  extractedError?: string;
  problemLines?: number[];
  resources: Resource[];
  // New fields
  learningConcept?: LearningConcept;
  commitMessage?: string;
  bugWarnings?: BugWarning[];
  dependencyFix?: DependencyFix;
  stackTraceAnalysis?: StackTraceAnalysis;
  // Code review fields
  qualitySuggestions?: string[];
  performanceImprovements?: string[];
  bestPractices?: string[];
  improvedCode?: string;
  summary?: string;
}

const resourceIcon = (type: string) => {
  switch (type) {
    case "stackoverflow":
      return <Globe className="h-4 w-4 text-primary shrink-0" />;
    case "docs":
      return <Code className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <ExternalLink className="h-4 w-4 text-primary shrink-0" />;
  }
};

const difficultyColor = (d?: string) => {
  switch (d) {
    case "Easy": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "Medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "Advanced": return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";
    default: return "";
  }
};

const severityColor = (s: string) => {
  switch (s) {
    case "high": return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";
    case "medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "low": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    default: return "";
  }
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs font-mono h-7">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

function CodeBlock({ code, title, icon }: { code: string; title: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CopyButton text={code} label="Copy" />
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

function VoiceButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  const handleVoice = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleVoice} className="gap-1.5 text-xs font-mono h-7">
      {speaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      {speaking ? "Stop" : "Voice"}
    </Button>
  );
}

function TestGenerator({ code, language }: { code: string; language: string }) {
  const [tests, setTests] = useState<{ framework: string; testCode: string; testDescriptions: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tests", {
        body: { code, language },
      });
      if (error) throw error;
      setTests(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate tests");
    } finally {
      setLoading(false);
    }
  };

  if (tests) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <TestTube className="h-4 w-4 text-primary" /> Generated Tests
              <Badge variant="outline" className="font-mono text-[10px]">{tests.framework}</Badge>
            </CardTitle>
            <CopyButton text={tests.testCode} label="Copy Tests" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tests.testDescriptions?.length > 0 && (
            <ul className="space-y-1">
              {tests.testDescriptions.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
          <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed">
            <code>{tests.testCode}</code>
          </pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button variant="outline" onClick={generate} disabled={loading} className="gap-2 font-mono text-xs">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
      {loading ? "Generating Tests…" : "Generate Unit Tests"}
    </Button>
  );
}

export const ResultDisplay = ({
  result,
  isReview = false,
  onShare,
  similarError,
}: {
  result: ExplanationResult;
  isReview?: boolean;
  onShare?: () => void;
  similarError?: { errorMessage: string; timestamp: number } | null;
}) => {
  const hasStructuredFixes = result.fixes?.length > 0 && typeof result.fixes[0] === "object" && "title" in (result.fixes[0] as any);

  // Build voice text from explanation
  const voiceText = [
    result.explanation,
    result.causes?.length ? `Common causes include: ${result.causes.join(". ")}` : "",
  ].filter(Boolean).join(". ");

  // Code review mode
  if (isReview) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="font-mono text-xs">{result.language || "Unknown"}</Badge>
          {result.framework && result.framework !== "None" && (
            <Badge variant="outline" className="font-mono text-xs gap-1">
              <Layers className="h-3 w-3" /> {result.framework}
            </Badge>
          )}
          <VoiceButton text={result.summary || result.explanation || ""} />
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare} className="ml-auto gap-1.5 text-xs font-mono h-7">
              <Share2 className="h-3 w-3" /> Share
            </Button>
          )}
        </div>

        {result.summary && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent-foreground" /> Review Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>
        )}

        {result.qualitySuggestions && result.qualitySuggestions.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Code Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.qualitySuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.performanceImprovements && result.performanceImprovements.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.performanceImprovements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-foreground" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.bestPractices && result.bestPractices.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.bestPractices.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Bug Warnings for review */}
        {result.bugWarnings && result.bugWarnings.length > 0 && (
          <Card className="border-border/60 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <Bug className="h-4 w-4 text-amber-500" /> Smart Bug Prevention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.bugWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(w.severity)}`}>
                    {w.severity}
                  </Badge>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground capitalize">{w.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{w.description}</p>
                    {w.line && <p className="text-xs text-muted-foreground font-mono">Line {w.line}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {result.improvedCode && (
          <CodeBlock code={result.improvedCode} title="Improved Code" icon={<Wand2 className="h-4 w-4 text-primary" />} />
        )}

        {/* Commit Message for review */}
        {result.commitMessage && (
          <div className="flex items-center gap-2 px-1 flex-wrap">
            <GitCommit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <code className="text-xs text-muted-foreground font-mono flex-1 min-w-0 truncate">{result.commitMessage}</code>
            <CopyButton text={result.commitMessage} label="Copy" />
          </div>
        )}

        {/* Test generator for review */}
        {result.improvedCode && (
          <div className="flex justify-end">
            <TestGenerator code={result.improvedCode} language={result.language} />
          </div>
        )}
      </div>
    );
  }

  // Error/Code/Terminal analysis mode
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Similar error match */}
      {similarError && (
        <Card className="border-border/60 border-l-4 border-l-primary bg-primary/5">
          <CardContent className="py-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-mono text-foreground">
              Similar Error Found — previously analyzed on {new Date(similarError.timestamp).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="font-mono text-xs">{result.language || "Unknown Language"}</Badge>
        {result.framework && result.framework !== "None" && (
          <Badge variant="outline" className="font-mono text-xs gap-1">
            <Layers className="h-3 w-3" /> {result.framework}
          </Badge>
        )}
        {result.difficulty && (
          <Badge variant="outline" className={`font-mono text-xs gap-1 ${difficultyColor(result.difficulty)}`}>
            <Shield className="h-3 w-3" /> {result.difficulty}
          </Badge>
        )}
        <VoiceButton text={voiceText} />
        {onShare && (
          <Button variant="ghost" size="sm" onClick={onShare} className="ml-auto gap-1.5 text-xs font-mono h-7">
            <Share2 className="h-3 w-3" /> Share
          </Button>
        )}
      </div>

      {result.difficultyExplanation && (
        <p className="text-xs text-muted-foreground font-mono px-1">{result.difficultyExplanation}</p>
      )}

      {/* Extracted error from terminal */}
      {result.extractedError && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Extracted Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground">
              {result.extractedError}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Stack Trace Analysis */}
      {result.stackTraceAnalysis && (
        <Card className="border-border/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" /> Stack Trace Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs font-mono">
              <span className="text-muted-foreground">Root Cause File:</span>
              <span className="text-foreground font-medium">{result.stackTraceAnalysis.rootCauseFile}</span>
              <span className="text-muted-foreground">Problem Line:</span>
              <span className="text-foreground font-medium">{result.stackTraceAnalysis.problemLine}</span>
              <span className="text-muted-foreground">Reason:</span>
              <span className="text-foreground">{result.stackTraceAnalysis.reason}</span>
              <span className="text-muted-foreground">Suggested Fix:</span>
              <span className="text-foreground">{result.stackTraceAnalysis.suggestedFix}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependency Fix */}
      {result.dependencyFix?.detected && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" /> Dependency Fix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{result.dependencyFix.explanation}</p>
            {result.dependencyFix.installCommands && (
              <div className="space-y-2">
                {Object.entries(result.dependencyFix.installCommands).map(([mgr, cmd]) => (
                  <div key={mgr} className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">{mgr}</Badge>
                    <code className="flex-1 text-xs font-mono bg-background border border-border rounded px-2 py-1 text-foreground">{cmd}</code>
                    <CopyButton text={cmd} label="Copy" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent-foreground" /> Error Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{result.explanation}</p>
        </CardContent>
      </Card>

      {/* Causes */}
      {result.causes?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Why This Error Happens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.causes.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {cause}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Multiple Fix Suggestions */}
      {result.fixes?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Possible Fixes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasStructuredFixes
              ? (result.fixes as FixOption[]).map((fix, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">
                        Fix {i + 1}
                      </Badge>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{fix.title}</p>
                        <p className="text-sm text-muted-foreground">{fix.description}</p>
                      </div>
                    </div>
                    {fix.code && (
                      <div className="ml-12">
                        <div className="flex justify-end mb-1">
                          <CopyButton text={fix.code} label="Copy" />
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground leading-relaxed">
                          <code>{fix.code}</code>
                        </pre>
                      </div>
                    )}
                    {i < (result.fixes as FixOption[]).length - 1 && (
                      <div className="border-t border-border/40 pt-2" />
                    )}
                  </div>
                ))
              : (result.fixes as string[]).map((fix, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">
                      {i + 1}
                    </Badge>
                    {fix}
                  </div>
                ))}
          </CardContent>
        </Card>
      )}

      {/* Corrected Code / Auto Fix */}
      {result.correctedCode && (
        <CodeBlock
          code={result.correctedCode}
          title="Auto-Fixed Code"
          icon={<Wand2 className="h-4 w-4 text-primary" />}
        />
      )}

      {/* Bug Warnings / Smart Prevention */}
      {result.bugWarnings && result.bugWarnings.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-500" /> Smart Bug Prevention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.bugWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(w.severity)}`}>
                  {w.severity}
                </Badge>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground capitalize">{w.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{w.description}</p>
                  {w.line && <p className="text-xs text-muted-foreground font-mono">Line {w.line}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Learn the Concept */}
      {result.learningConcept && (
        <Card className="border-border/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" /> Learn the Concept: {result.learningConcept.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">{result.learningConcept.explanation}</p>
            {result.learningConcept.example && (
              <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground leading-relaxed">
                <code>{result.learningConcept.example}</code>
              </pre>
            )}
            {result.learningConcept.bestPractices?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-2">Best Practices:</p>
                <ul className="space-y-1.5">
                  {result.learningConcept.bestPractices.map((bp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commit Message */}
      {result.commitMessage && (
        <div className="flex items-center gap-2 px-1 flex-wrap">
          <GitCommit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <code className="text-xs text-muted-foreground font-mono flex-1 min-w-0 truncate">{result.commitMessage}</code>
          <CopyButton text={result.commitMessage} label="Copy Commit" />
        </div>
      )}

      {/* Problem Lines */}
      {result.problemLines && result.problemLines.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <FileWarning className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">
            Issues on line{result.problemLines.length > 1 ? "s" : ""}: {result.problemLines.join(", ")}
          </span>
        </div>
      )}

      {/* Test Generator */}
      {result.correctedCode && (
        <div className="flex justify-end">
          <TestGenerator code={result.correctedCode} language={result.language} />
        </div>
      )}

      {/* Resources */}
      {result.resources?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Similar Solutions & Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.resources.map((res, i) => (
                <li key={i}>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline transition-colors"
                  >
                    {resourceIcon(res.type)}
                    <span className="text-sm">{res.title}</span>
                    <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                  </a>
                  <span className="text-xs text-muted-foreground ml-6 capitalize">
                    {res.type === "stackoverflow" ? "Stack Overflow" : res.type}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
