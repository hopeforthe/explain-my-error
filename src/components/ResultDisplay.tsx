import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Zap, Code, Lightbulb, Copy, Check, ExternalLink, Globe, Wand2, Share2,
  Shield, Layers, Star, CheckCircle2, TrendingUp, BookOpen, GraduationCap, Volume2, VolumeX,
  GitCommit, TestTube, Loader2, Package, Bug, FileWarning, FileCode, Database, Gauge, Clock,
  Lock, List, FileText, ArrowRightLeft, HelpCircle, Target,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── Interfaces ──
interface Resource { title: string; url: string; type: "stackoverflow" | "docs" | "article"; }
interface FixOption { title: string; description: string; code?: string; }
interface LearningConcept { title: string; explanation: string; example: string; bestPractices: string[]; }
interface BugWarning { type: string; description: string; severity: "low" | "medium" | "high"; line: number | null; }
interface DependencyFix { detected: boolean; packageName?: string; installCommands?: Record<string, string>; explanation?: string; }
interface StackTraceAnalysis { rootCauseFile: string; problemLine: number | string; reason: string; suggestedFix: string; }

// Security
interface Vulnerability { type: string; severity: string; line: number | null; description: string; fix: string; cwe?: string; }
// Performance
interface PerfIssue { type: string; severity: string; line: number | null; description: string; fix: string; impact?: string; }
// Log
interface LogError { message: string; timestamp: string | null; source: string | null; explanation: string; }
interface LogWarning { message: string; significance: string; }
interface TimelineEvent { time: string | null; event: string; severity: string; }
// Explain
interface LineExplanation { lines: string; code: string; explanation: string; }
// SQL
interface SqlSyntaxError { description: string; fix: string; }
interface SqlPerfIssue { issue: string; suggestion: string; impact?: string; }
// Diff
interface DiffChange { type: string; description: string; oldCode: string | null; newCode: string | null; line: number | null; }
// Complexity
interface ComplexityHotspot { location: string; complexity: string; suggestion: string; }
// Interview
interface InterviewQuestion { question: string; difficulty: string; answer: string; followUp?: string; }
// API
interface DebugSimStep { step: number; description: string; state: string; }

// Migration
interface BreakingChange { description: string; oldSyntax: string; newSyntax: string; }

// Docs
interface FunctionDoc { name: string; description: string; params: { name: string; type: string; description: string }[]; returns: string; example: string; }

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
  learningConcept?: LearningConcept;
  commitMessage?: string;
  bugWarnings?: BugWarning[];
  dependencyFix?: DependencyFix;
  stackTraceAnalysis?: StackTraceAnalysis;
  qualitySuggestions?: string[];
  performanceImprovements?: string[];
  bestPractices?: string[];
  improvedCode?: string;
  summary?: string;
  // Security
  vulnerabilities?: Vulnerability[];
  securityScore?: number;
  recommendations?: string[];
  // Performance
  issues?: PerfIssue[];
  performanceScore?: number;
  complexityAnalysis?: { timeComplexity?: string; spaceComplexity?: string; explanation?: string; before?: string; after?: string };
  // Log
  criticalErrors?: LogError[];
  warnings?: LogWarning[];
  rootCause?: { description: string; evidence: string; suggestedFix: string };
  timeline?: TimelineEvent[];
  // Explain
  lineExplanations?: LineExplanation[];
  keyConceptsCovered?: string[];
  flowDescription?: string[];
  // SQL
  syntaxErrors?: SqlSyntaxError[];
  performanceIssues?: SqlPerfIssue[];
  queryPlan?: string;
  // API
  statusCode?: number | null;
  statusMeaning?: string;
  headerIssues?: string[];
  parameterIssues?: string[];
  curlExample?: string;
  // Diff
  changes?: DiffChange[];
  bugIntroduced?: boolean;
  bugExplanation?: string | null;
  suggestions?: string[];
  // Complexity
  cyclomaticComplexity?: number;
  maintainabilityScore?: number;
  codeQuality?: string;
  metrics?: { linesOfCode?: number; functionCount?: number; nestingDepth?: number; cognitiveComplexity?: number };
  hotspots?: ComplexityHotspot[];
  simplificationSuggestions?: string[];
  // Env
  platform?: string;
  versionIssues?: { package: string; currentVersion: string | null; requiredVersion: string; fix: string }[];
  missingDependencies?: string[];
  setupChecklist?: string[];
  // CI/CD & Deploy
  failedStep?: string;
  environmentIssues?: string[];
  checklist?: string[];
  // Interview
  topic?: string;
  conceptExplanation?: string;
  questions?: InterviewQuestion[];
  keyTakeaways?: string[];
  commonMistakes?: string[];
  // Docs
  functionDocs?: FunctionDoc[];
  readme?: string;
  usageExamples?: string[];
  apiDocs?: string;
  // Reproduce
  rootCauseText?: string;
  minimalExample?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  debugSteps?: string[];
  // Migration
  sourceVersion?: string;
  targetVersion?: string;
  breakingChanges?: BreakingChange[];
  migrationSteps?: string[];
  deprecations?: string[];
  // Error extras
  errorCategory?: string;
  debugChecklist?: string[];
  debugSimulation?: DebugSimStep[];
}

// ── Helpers ──
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
    case "critical": case "high": return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";
    case "medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "low": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    default: return "";
  }
};

const resourceIcon = (type: string) => {
  switch (type) {
    case "stackoverflow": return <Globe className="h-4 w-4 text-primary shrink-0" />;
    case "docs": return <Code className="h-4 w-4 text-primary shrink-0" />;
    default: return <ExternalLink className="h-4 w-4 text-primary shrink-0" />;
  }
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="outline" size="sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Failed to copy"); }
    }} className="gap-1.5 text-xs font-mono h-7">
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
          <CardTitle className="text-base font-mono flex items-center gap-2">{icon}{title}</CardTitle>
          <CopyButton text={code} />
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed"><code>{code}</code></pre>
      </CardContent>
    </Card>
  );
}

function VoiceButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const handleVoice = () => {
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    speechSynthesis.speak(u);
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
      const { data, error } = await supabase.functions.invoke("generate-tests", { body: { code, language } });
      if (error) throw error;
      setTests(data);
    } catch (err: any) { toast.error(err?.message || "Failed to generate tests"); }
    finally { setLoading(false); }
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
            <ul className="space-y-1">{tests.testDescriptions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />{d}</li>
            ))}</ul>
          )}
          <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed"><code>{tests.testCode}</code></pre>
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

// Simple list card helper
function ListCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2">{icon}{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2">{items.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{s}
          </li>
        ))}</ul>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──
export const ResultDisplay = ({
  result, inputMode = "error", isReview = false, onShare, similarError,
}: {
  result: ExplanationResult;
  inputMode?: string;
  isReview?: boolean;
  onShare?: () => void;
  similarError?: { errorMessage: string; timestamp: number } | null;
}) => {
  const hasStructuredFixes = result.fixes?.length > 0 && typeof result.fixes[0] === "object" && "title" in (result.fixes[0] as any);
  const voiceText = [result.explanation || result.summary, result.causes?.length ? `Common causes: ${result.causes.join(". ")}` : ""].filter(Boolean).join(". ");

  // ── Badge Row ──
  const BadgeRow = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className="font-mono text-xs">{result.language || "Unknown"}</Badge>
      {result.framework && result.framework !== "None" && (
        <Badge variant="outline" className="font-mono text-xs gap-1"><Layers className="h-3 w-3" /> {result.framework}</Badge>
      )}
      {result.difficulty && (
        <Badge variant="outline" className={`font-mono text-xs gap-1 ${difficultyColor(result.difficulty)}`}><Shield className="h-3 w-3" /> {result.difficulty}</Badge>
      )}
      {result.errorCategory && (
        <Badge variant="outline" className="font-mono text-xs gap-1"><Target className="h-3 w-3" /> {result.errorCategory}</Badge>
      )}
      {result.platform && (
        <Badge variant="outline" className="font-mono text-xs gap-1">{result.platform}</Badge>
      )}
      {result.securityScore !== undefined && (
        <Badge variant="outline" className={`font-mono text-xs gap-1 ${result.securityScore >= 70 ? severityColor("low") : result.securityScore >= 40 ? severityColor("medium") : severityColor("high")}`}>
          <Lock className="h-3 w-3" /> Security: {result.securityScore}/100
        </Badge>
      )}
      {result.performanceScore !== undefined && (
        <Badge variant="outline" className={`font-mono text-xs gap-1 ${result.performanceScore >= 70 ? severityColor("low") : result.performanceScore >= 40 ? severityColor("medium") : severityColor("high")}`}>
          <Gauge className="h-3 w-3" /> Perf: {result.performanceScore}/100
        </Badge>
      )}
      {result.maintainabilityScore !== undefined && (
        <Badge variant="outline" className="font-mono text-xs gap-1">
          <Gauge className="h-3 w-3" /> Maintainability: {result.maintainabilityScore}/100
        </Badge>
      )}
      {result.codeQuality && (
        <Badge variant="outline" className="font-mono text-xs">{result.codeQuality}</Badge>
      )}
      <VoiceButton text={voiceText} />
      {onShare && (
        <Button variant="ghost" size="sm" onClick={onShare} className="ml-auto gap-1.5 text-xs font-mono h-7">
          <Share2 className="h-3 w-3" /> Share
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Similar error */}
      {similarError && (
        <Card className="border-border/60 border-l-4 border-l-primary bg-primary/5">
          <CardContent className="py-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-mono text-foreground">Similar Error Found — previously analyzed on {new Date(similarError.timestamp).toLocaleDateString()}</span>
          </CardContent>
        </Card>
      )}

      <BadgeRow />

      {result.difficultyExplanation && <p className="text-xs text-muted-foreground font-mono px-1">{result.difficultyExplanation}</p>}

      {/* Extracted error from terminal */}
      {result.extractedError && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Extracted Error</CardTitle></CardHeader>
          <CardContent><pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground">{result.extractedError}</pre></CardContent>
        </Card>
      )}

      {/* Stack Trace Analysis */}
      {result.stackTraceAnalysis && (
        <Card className="border-border/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><FileCode className="h-4 w-4 text-primary" /> Stack Trace Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs font-mono">
              <span className="text-muted-foreground">Root Cause File:</span><span className="text-foreground font-medium">{result.stackTraceAnalysis.rootCauseFile}</span>
              <span className="text-muted-foreground">Problem Line:</span><span className="text-foreground font-medium">{result.stackTraceAnalysis.problemLine}</span>
              <span className="text-muted-foreground">Reason:</span><span className="text-foreground">{result.stackTraceAnalysis.reason}</span>
              <span className="text-muted-foreground">Suggested Fix:</span><span className="text-foreground">{result.stackTraceAnalysis.suggestedFix}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Status Code */}
      {result.statusCode && result.statusMeaning && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Globe className="h-4 w-4 text-destructive" /> HTTP {result.statusCode}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-foreground">{result.statusMeaning}</p></CardContent>
        </Card>
      )}

      {/* Dependency Fix */}
      {result.dependencyFix?.detected && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Package className="h-4 w-4 text-amber-500" /> Dependency Fix</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{result.dependencyFix.explanation}</p>
            {result.dependencyFix.installCommands && (
              <div className="space-y-2">{Object.entries(result.dependencyFix.installCommands).map(([mgr, cmd]) => (
                <div key={mgr} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0">{mgr}</Badge>
                  <code className="flex-1 text-xs font-mono bg-background border border-border rounded px-2 py-1 text-foreground">{cmd}</code>
                  <CopyButton text={cmd} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary / Explanation */}
      {(result.summary || result.explanation) && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent-foreground" /> {result.summary && isReview ? "Review Summary" : "Explanation"}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-foreground leading-relaxed">{result.summary || result.explanation}</p></CardContent>
        </Card>
      )}

      {/* Causes */}
      <ListCard title="Why This Happens" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} items={result.causes} />

      {/* Vulnerabilities (Security mode) */}
      {result.vulnerabilities && result.vulnerabilities.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-rose-500">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Lock className="h-4 w-4 text-rose-500" /> Security Vulnerabilities</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.vulnerabilities.map((v, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(v.severity)}`}>{v.severity}</Badge>
                <div>
                  <p className="text-sm font-medium text-foreground">{v.type}{v.cwe ? ` (${v.cwe})` : ""}</p>
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                  {v.line && <p className="text-xs text-muted-foreground font-mono">Line {v.line}</p>}
                  <p className="text-xs text-foreground mt-1"><strong>Fix:</strong> {v.fix}</p>
                </div>
              </div>
              {i < result.vulnerabilities!.length - 1 && <div className="border-t border-border/40" />}
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Performance Issues */}
      {result.issues && result.issues.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Performance Issues</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.issues.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(p.severity)}`}>{p.severity}</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">{p.type}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                {p.line && <p className="text-xs text-muted-foreground font-mono">Line {p.line}</p>}
                <p className="text-xs text-foreground mt-1"><strong>Fix:</strong> {p.fix}</p>
                {p.impact && <p className="text-xs text-muted-foreground">Impact: {p.impact}</p>}
              </div>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Complexity Analysis */}
      {result.complexityAnalysis && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Complexity Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs font-mono">
              {result.complexityAnalysis.timeComplexity && <><span className="text-muted-foreground">Time:</span><span className="text-foreground">{result.complexityAnalysis.timeComplexity}</span></>}
              {result.complexityAnalysis.spaceComplexity && <><span className="text-muted-foreground">Space:</span><span className="text-foreground">{result.complexityAnalysis.spaceComplexity}</span></>}
              {result.complexityAnalysis.before && <><span className="text-muted-foreground">Before:</span><span className="text-foreground">{result.complexityAnalysis.before}</span></>}
              {result.complexityAnalysis.after && <><span className="text-muted-foreground">After:</span><span className="text-foreground">{result.complexityAnalysis.after}</span></>}
              {result.complexityAnalysis.explanation && <><span className="text-muted-foreground">Details:</span><span className="text-foreground">{result.complexityAnalysis.explanation}</span></>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics (Complexity mode) */}
      {result.metrics && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Code Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {result.cyclomaticComplexity !== undefined && <div className="text-center p-2 rounded border border-border"><p className="text-lg font-bold text-foreground">{result.cyclomaticComplexity}</p><p className="text-[10px] text-muted-foreground font-mono">Cyclomatic Complexity</p></div>}
              {result.metrics.cognitiveComplexity !== undefined && <div className="text-center p-2 rounded border border-border"><p className="text-lg font-bold text-foreground">{result.metrics.cognitiveComplexity}</p><p className="text-[10px] text-muted-foreground font-mono">Cognitive Complexity</p></div>}
              {result.metrics.linesOfCode !== undefined && <div className="text-center p-2 rounded border border-border"><p className="text-lg font-bold text-foreground">{result.metrics.linesOfCode}</p><p className="text-[10px] text-muted-foreground font-mono">Lines of Code</p></div>}
              {result.metrics.functionCount !== undefined && <div className="text-center p-2 rounded border border-border"><p className="text-lg font-bold text-foreground">{result.metrics.functionCount}</p><p className="text-[10px] text-muted-foreground font-mono">Functions</p></div>}
              {result.metrics.nestingDepth !== undefined && <div className="text-center p-2 rounded border border-border"><p className="text-lg font-bold text-foreground">{result.metrics.nestingDepth}</p><p className="text-[10px] text-muted-foreground font-mono">Max Nesting Depth</p></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotspots */}
      {result.hotspots && result.hotspots.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Target className="h-4 w-4 text-destructive" /> Complexity Hotspots</CardTitle></CardHeader>
          <CardContent className="space-y-2">{result.hotspots.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(h.complexity)}`}>{h.complexity}</Badge>
              <div><p className="text-sm font-medium text-foreground font-mono">{h.location}</p><p className="text-xs text-muted-foreground">{h.suggestion}</p></div>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Line Explanations (Explain mode) */}
      {result.lineExplanations && result.lineExplanations.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Line-by-Line Explanation</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.lineExplanations.map((le, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2"><Badge variant="outline" className="font-mono text-[10px]">Lines {le.lines}</Badge></div>
              <pre className="overflow-x-auto rounded bg-background border border-border p-2 font-mono text-xs text-foreground">{le.code}</pre>
              <p className="text-sm text-muted-foreground pl-1">{le.explanation}</p>
              {i < result.lineExplanations!.length - 1 && <div className="border-t border-border/40 pt-1" />}
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Flow Description */}
      {result.flowDescription && result.flowDescription.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Execution Flow</CardTitle></CardHeader>
          <CardContent><ol className="space-y-1.5">{result.flowDescription.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground"><Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">{i + 1}</Badge>{s}</li>
          ))}</ol></CardContent>
        </Card>
      )}

      {/* Key Concepts */}
      <ListCard title="Key Concepts" icon={<GraduationCap className="h-4 w-4 text-primary" />} items={result.keyConceptsCovered || []} />

      {/* SQL Syntax Errors */}
      {result.syntaxErrors && result.syntaxErrors.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Database className="h-4 w-4 text-destructive" /> SQL Syntax Errors</CardTitle></CardHeader>
          <CardContent className="space-y-2">{result.syntaxErrors.map((e, i) => (
            <div key={i}><p className="text-sm text-foreground">{e.description}</p><p className="text-xs text-primary font-mono">Fix: {e.fix}</p></div>
          ))}</CardContent>
        </Card>
      )}

      {/* SQL Performance Issues */}
      {result.performanceIssues && result.performanceIssues.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Query Performance</CardTitle></CardHeader>
          <CardContent className="space-y-2">{result.performanceIssues.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              {p.impact && <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(p.impact)}`}>{p.impact}</Badge>}
              <div><p className="text-sm text-foreground">{p.issue}</p><p className="text-xs text-muted-foreground">{p.suggestion}</p></div>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* API Issues */}
      <ListCard title="Header Issues" icon={<Globe className="h-4 w-4 text-amber-500" />} items={result.headerIssues || []} />
      <ListCard title="Parameter Issues" icon={<Globe className="h-4 w-4 text-amber-500" />} items={result.parameterIssues || []} />

      {/* Curl Example */}
      {result.curlExample && <CodeBlock code={result.curlExample} title="Working curl Example" icon={<Code className="h-4 w-4 text-primary" />} />}

      {/* Critical Errors (Log mode) */}
      {result.criticalErrors && result.criticalErrors.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Critical Errors</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.criticalErrors.map((e, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-sm font-medium text-foreground font-mono">{e.message}</p>
              {e.timestamp && <p className="text-xs text-muted-foreground">Time: {e.timestamp}</p>}
              {e.source && <p className="text-xs text-muted-foreground">Source: {e.source}</p>}
              <p className="text-xs text-foreground">{e.explanation}</p>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Log Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><FileWarning className="h-4 w-4 text-amber-500" /> Warnings</CardTitle></CardHeader>
          <CardContent className="space-y-2">{result.warnings.map((w, i) => (
            <div key={i}><p className="text-sm text-foreground">{w.message}</p><p className="text-xs text-muted-foreground">{w.significance}</p></div>
          ))}</CardContent>
        </Card>
      )}

      {/* Root Cause (Log mode) */}
      {result.rootCause && (
        <Card className="border-border/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Root Cause</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-foreground">{result.rootCause.description}</p>
            <p className="text-xs text-muted-foreground">Evidence: {result.rootCause.evidence}</p>
            <p className="text-xs text-foreground"><strong>Fix:</strong> {result.rootCause.suggestedFix}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {result.timeline && result.timeline.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Event Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{result.timeline.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] ${severityColor(t.severity)}`}>{t.severity}</Badge>
                {t.time && <span className="text-xs text-muted-foreground font-mono shrink-0">{t.time}</span>}
                <span className="text-sm text-foreground">{t.event}</span>
              </div>
            ))}</div>
          </CardContent>
        </Card>
      )}

      {/* Debug Simulation */}
      {result.debugSimulation && result.debugSimulation.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Bug className="h-4 w-4 text-primary" /> Debug Simulation</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{result.debugSimulation.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">Step {s.step}</Badge>
                <div><p className="text-sm text-foreground">{s.description}</p><p className="text-xs text-muted-foreground font-mono">State: {s.state}</p></div>
              </div>
            ))}</div>
          </CardContent>
        </Card>
      )}

      {/* Code Diff Changes */}
      {result.changes && result.changes.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-primary" /> Code Changes</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.changes.map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`font-mono text-[10px] ${c.type === "added" ? severityColor("low") : c.type === "removed" ? severityColor("high") : severityColor("medium")}`}>{c.type}</Badge>
                <span className="text-sm text-foreground">{c.description}</span>
              </div>
              {c.oldCode && <pre className="rounded bg-rose-500/5 border border-rose-500/20 p-2 font-mono text-xs text-foreground">- {c.oldCode}</pre>}
              {c.newCode && <pre className="rounded bg-emerald-500/5 border border-emerald-500/20 p-2 font-mono text-xs text-foreground">+ {c.newCode}</pre>}
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Bug Introduced Warning */}
      {result.bugIntroduced && result.bugExplanation && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Bug className="h-4 w-4 text-destructive" /> Bug Introduced!</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-foreground">{result.bugExplanation}</p></CardContent>
        </Card>
      )}

      {/* Breaking Changes (Migrate) */}
      {result.breakingChanges && result.breakingChanges.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Breaking Changes</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.breakingChanges.map((bc, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm text-foreground">{bc.description}</p>
              <pre className="rounded bg-rose-500/5 border border-rose-500/20 p-2 font-mono text-xs text-foreground">- {bc.oldSyntax}</pre>
              <pre className="rounded bg-emerald-500/5 border border-emerald-500/20 p-2 font-mono text-xs text-foreground">+ {bc.newSyntax}</pre>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Migration Steps */}
      <ListCard title="Migration Steps" icon={<ArrowRightLeft className="h-4 w-4 text-primary" />} items={result.migrationSteps || []} />
      <ListCard title="Deprecations" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} items={result.deprecations || []} />

      {/* Interview Questions */}
      {result.questions && result.questions.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Interview Questions</CardTitle></CardHeader>
          <CardContent className="space-y-4">{result.questions.map((q, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(q.difficulty === "easy" ? "low" : q.difficulty === "hard" ? "high" : "medium")}`}>{q.difficulty}</Badge>
                <p className="text-sm font-medium text-foreground">{q.question}</p>
              </div>
              <details className="pl-12">
                <summary className="text-xs text-primary cursor-pointer font-mono">Show Answer</summary>
                <p className="text-sm text-muted-foreground mt-1">{q.answer}</p>
                {q.followUp && <p className="text-xs text-muted-foreground mt-1 italic">Follow-up: {q.followUp}</p>}
              </details>
            </div>
          ))}</CardContent>
        </Card>
      )}
      <ListCard title="Key Takeaways" icon={<Star className="h-4 w-4 text-primary" />} items={result.keyTakeaways || []} />
      <ListCard title="Common Mistakes" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} items={result.commonMistakes || []} />

      {/* Function Docs */}
      {result.functionDocs && result.functionDocs.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Function Documentation</CardTitle></CardHeader>
          <CardContent className="space-y-4">{result.functionDocs.map((fd, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm font-medium text-foreground font-mono">{fd.name}</p>
              <p className="text-xs text-muted-foreground">{fd.description}</p>
              {fd.params?.length > 0 && (
                <div className="ml-2 space-y-0.5">{fd.params.map((p, j) => (
                  <p key={j} className="text-xs font-mono text-foreground"><span className="text-primary">@param</span> {p.name}: {p.type} — {p.description}</p>
                ))}</div>
              )}
              <p className="text-xs font-mono text-foreground"><span className="text-primary">@returns</span> {fd.returns}</p>
              {fd.example && <pre className="overflow-x-auto rounded bg-background border border-border p-2 font-mono text-xs text-foreground">{fd.example}</pre>}
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* README */}
      {result.readme && <CodeBlock code={result.readme} title="Generated README" icon={<FileText className="h-4 w-4 text-primary" />} />}

      {/* Usage Examples */}
      {result.usageExamples && result.usageExamples.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Code className="h-4 w-4 text-primary" /> Usage Examples</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.usageExamples.map((ex, i) => (
            <div key={i}>
              <div className="flex justify-end mb-1"><CopyButton text={ex} /></div>
              <pre className="overflow-x-auto rounded bg-background border border-border p-3 font-mono text-xs text-foreground">{ex}</pre>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Reproduce Bug */}
      {result.minimalExample && (
        <>
          {result.expectedBehavior && result.actualBehavior && (
            <Card className="border-border/60">
              <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Bug className="h-4 w-4 text-primary" /> Bug Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div><p className="text-xs font-mono text-muted-foreground">Expected:</p><p className="text-sm text-foreground">{result.expectedBehavior}</p></div>
                <div><p className="text-xs font-mono text-muted-foreground">Actual:</p><p className="text-sm text-foreground">{result.actualBehavior}</p></div>
              </CardContent>
            </Card>
          )}
          <CodeBlock code={result.minimalExample} title="Minimal Reproducible Example" icon={<Bug className="h-4 w-4 text-primary" />} />
        </>
      )}
      <ListCard title="Debug Steps" icon={<List className="h-4 w-4 text-primary" />} items={result.debugSteps || []} />

      {/* Environment Issues */}
      <ListCard title="Environment Issues" icon={<Wrench className="h-4 w-4 text-amber-500" />} items={result.environmentIssues || []} />

      {/* Version Issues */}
      {result.versionIssues && result.versionIssues.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Package className="h-4 w-4 text-amber-500" /> Version Issues</CardTitle></CardHeader>
          <CardContent className="space-y-2">{result.versionIssues.map((v, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">{v.package}</Badge>
              <div>
                {v.currentVersion && <p className="text-xs text-muted-foreground">Current: {v.currentVersion}</p>}
                <p className="text-xs text-foreground">Required: {v.requiredVersion}</p>
                <p className="text-xs text-primary font-mono">{v.fix}</p>
              </div>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Setup/Deploy Checklist */}
      <ListCard title="Checklist" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} items={result.setupChecklist || result.checklist || []} />

      {/* Multiple Fix Suggestions */}
      {result.fixes?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Possible Fixes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {hasStructuredFixes
              ? (result.fixes as FixOption[]).map((fix, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">Fix {i + 1}</Badge>
                      <div className="space-y-1"><p className="text-sm font-medium text-foreground">{fix.title}</p><p className="text-sm text-muted-foreground">{fix.description}</p></div>
                    </div>
                    {fix.code && (
                      <div className="ml-12">
                        <div className="flex justify-end mb-1"><CopyButton text={fix.code} /></div>
                        <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground leading-relaxed"><code>{fix.code}</code></pre>
                      </div>
                    )}
                    {i < (result.fixes as FixOption[]).length - 1 && <div className="border-t border-border/40 pt-2" />}
                  </div>
                ))
              : (result.fixes as string[]).map((fix, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground"><Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">{i + 1}</Badge>{fix}</div>
                ))}
          </CardContent>
        </Card>
      )}

      {/* Quality / Performance / Best Practices (Review modes) */}
      <ListCard title="Code Quality" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} items={result.qualitySuggestions || []} />
      <ListCard title="Performance Improvements" icon={<TrendingUp className="h-4 w-4 text-primary" />} items={result.performanceImprovements || []} />
      <ListCard title="Best Practices" icon={<BookOpen className="h-4 w-4 text-primary" />} items={result.bestPractices || []} />
      <ListCard title="Recommendations" icon={<Lightbulb className="h-4 w-4 text-primary" />} items={result.recommendations || []} />
      <ListCard title="Simplification Suggestions" icon={<Wand2 className="h-4 w-4 text-primary" />} items={result.simplificationSuggestions || []} />
      <ListCard title="Suggestions" icon={<Lightbulb className="h-4 w-4 text-primary" />} items={result.suggestions || []} />

      {/* Corrected/Improved Code */}
      {(result.correctedCode || result.improvedCode) && (
        <CodeBlock
          code={result.improvedCode || result.correctedCode}
          title={isReview ? "Improved Code" : "Auto-Fixed Code"}
          icon={<Wand2 className="h-4 w-4 text-primary" />}
        />
      )}

      {/* Query Plan */}
      {result.queryPlan && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Query Plan</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-foreground">{result.queryPlan}</p></CardContent>
        </Card>
      )}

      {/* Bug Warnings */}
      {result.bugWarnings && result.bugWarnings.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Bug className="h-4 w-4 text-amber-500" /> Smart Bug Prevention</CardTitle></CardHeader>
          <CardContent className="space-y-3">{result.bugWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityColor(w.severity)}`}>{w.severity}</Badge>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground capitalize">{w.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{w.description}</p>
                {w.line && <p className="text-xs text-muted-foreground font-mono">Line {w.line}</p>}
              </div>
            </div>
          ))}</CardContent>
        </Card>
      )}

      {/* Learn the Concept */}
      {result.learningConcept && (
        <Card className="border-border/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Learn the Concept: {result.learningConcept.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">{result.learningConcept.explanation}</p>
            {result.learningConcept.example && <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground leading-relaxed"><code>{result.learningConcept.example}</code></pre>}
            {result.learningConcept.bestPractices?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-2">Best Practices:</p>
                <ul className="space-y-1.5">{result.learningConcept.bestPractices.map((bp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />{bp}</li>
                ))}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Checklist */}
      {result.debugChecklist && result.debugChecklist.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><List className="h-4 w-4 text-primary" /> Debugging Checklist</CardTitle></CardHeader>
          <CardContent><ol className="space-y-1.5">{result.debugChecklist.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground"><Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">{i + 1}</Badge>{s}</li>
          ))}</ol></CardContent>
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
          <span className="text-xs text-muted-foreground font-mono">Issues on line{result.problemLines.length > 1 ? "s" : ""}: {result.problemLines.join(", ")}</span>
        </div>
      )}

      {/* Test Generator */}
      {(result.correctedCode || result.improvedCode) && (
        <div className="flex justify-end"><TestGenerator code={result.improvedCode || result.correctedCode} language={result.language} /></div>
      )}

      {/* Resources */}
      {result.resources?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base font-mono flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Resources</CardTitle></CardHeader>
          <CardContent><ul className="space-y-3">{result.resources.map((res, i) => (
            <li key={i}>
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline transition-colors">
                {resourceIcon(res.type)}<span className="text-sm">{res.title}</span><ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
              </a>
              <span className="text-xs text-muted-foreground ml-6 capitalize">{res.type === "stackoverflow" ? "Stack Overflow" : res.type}</span>
            </li>
          ))}</ul></CardContent>
        </Card>
      )}
    </div>
  );
};
