import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Zap, Code, Lightbulb, Copy, Check, ExternalLink, Globe, Wand2, Share2,
  Shield, Layers, Star, CheckCircle2, TrendingUp, BookOpen, GraduationCap, Volume2, VolumeX,
  GitCommit, TestTube, Loader2, Package, Bug, FileWarning, FileCode, Database, Gauge, Clock,
  Lock, List, FileText, ArrowRightLeft, HelpCircle, Target, Wrench, ChevronDown, GitCompare,
  ClipboardList, TestTubes, ListChecks, Clipboard, Play, Square,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// ── Interfaces ──
interface Resource { title: string; url: string; type: "stackoverflow" | "docs" | "article"; }
interface FixOption { title: string; description: string; code?: string; }
interface LearningConcept { title: string; explanation: string; example: string; bestPractices: string[]; }
interface BugWarning { type: string; description: string; severity: "low" | "medium" | "high"; line: number | null; }
interface DependencyFix { detected: boolean; packageName?: string; installCommands?: Record<string, string>; explanation?: string; }
interface StackTraceAnalysis { rootCauseFile: string; problemLine: number | string; reason: string; suggestedFix: string; }
interface Vulnerability { type: string; severity: string; line: number | null; description: string; fix: string; cwe?: string; }
interface PerfIssue { type: string; severity: string; line: number | null; description: string; fix: string; impact?: string; }
interface LogError { message: string; timestamp: string | null; source: string | null; explanation: string; }
interface LogWarning { message: string; significance: string; }
interface TimelineEvent { time: string | null; event: string; severity: string; }
interface LineExplanation { lines: string; code: string; explanation: string; }
interface SqlSyntaxError { description: string; fix: string; }
interface SqlPerfIssue { issue: string; suggestion: string; impact?: string; }
interface DiffChange { type: string; description: string; oldCode: string | null; newCode: string | null; line: number | null; }
interface ComplexityHotspot { location: string; complexity: string; suggestion: string; }
interface InterviewQuestion { question: string; difficulty: string; answer: string; followUp?: string; }
interface DebugSimStep { step: number; description: string; state: string; }
interface BreakingChange { description: string; oldSyntax: string; newSyntax: string; }
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
  vulnerabilities?: Vulnerability[];
  securityScore?: number;
  recommendations?: string[];
  issues?: PerfIssue[];
  performanceScore?: number;
  complexityAnalysis?: { timeComplexity?: string; spaceComplexity?: string; explanation?: string; before?: string; after?: string };
  criticalErrors?: LogError[];
  warnings?: LogWarning[];
  rootCause?: { description: string; evidence: string; suggestedFix: string };
  timeline?: TimelineEvent[];
  lineExplanations?: LineExplanation[];
  keyConceptsCovered?: string[];
  flowDescription?: string[];
  syntaxErrors?: SqlSyntaxError[];
  performanceIssues?: SqlPerfIssue[];
  queryPlan?: string;
  statusCode?: number | null;
  statusMeaning?: string;
  headerIssues?: string[];
  parameterIssues?: string[];
  curlExample?: string;
  changes?: DiffChange[];
  bugIntroduced?: boolean;
  bugExplanation?: string | null;
  suggestions?: string[];
  cyclomaticComplexity?: number;
  maintainabilityScore?: number;
  codeQuality?: string;
  metrics?: { linesOfCode?: number; functionCount?: number; nestingDepth?: number; cognitiveComplexity?: number };
  hotspots?: ComplexityHotspot[];
  simplificationSuggestions?: string[];
  platform?: string;
  versionIssues?: { package: string; currentVersion: string | null; requiredVersion: string; fix: string }[];
  missingDependencies?: string[];
  setupChecklist?: string[];
  failedStep?: string;
  environmentIssues?: string[];
  checklist?: string[];
  topic?: string;
  conceptExplanation?: string;
  questions?: InterviewQuestion[];
  keyTakeaways?: string[];
  commonMistakes?: string[];
  functionDocs?: FunctionDoc[];
  readme?: string;
  usageExamples?: string[];
  apiDocs?: string;
  rootCauseText?: string;
  minimalExample?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  debugSteps?: string[];
  sourceVersion?: string;
  targetVersion?: string;
  breakingChanges?: BreakingChange[];
  migrationSteps?: string[];
  deprecations?: string[];
  errorCategory?: string;
  debugChecklist?: string[];
  debugSimulation?: DebugSimStep[];
  patchDiff?: string;
  pullRequestSuggestion?: { title: string; description: string };
  executionPath?: string[];
  affectedFiles?: { file: string; line: number | null; role: string }[];
  quickSummary?: { rootCause: string; quickFix: string };
  contextualSuggestions?: { bestPractices: string[]; commonMistakes: string[]; interviewTip: string | null };
  bugSpecificTests?: string[];
  // QA / Tester fields
  bugTitle?: string;
  description?: string;
  stepsToReproduce?: string[];
  expectedResult?: string;
  actualResult?: string;
  possibleRootCause?: string;
  severity?: string;
  severityReason?: string;
  priority?: string;
  priorityReason?: string;
  environment?: string;
  additionalNotes?: string;
  testCases?: { id: string; type: string; scenario: string; steps: string[]; expectedResult: string; priority: string }[];
  coverageSummary?: { positiveCount: number; negativeCount: number; edgeCaseCount: number; totalCount: number };
  featureName?: string;
  functionalScenarios?: string[];
  edgeCaseScenarios?: string[];
  negativeScenarios?: string[];
  securityScenarios?: string[];
  performanceScenarios?: string[];
}

// ── Helpers ──
const safeStr = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
};

const severityBadge = (s: string) => {
  switch (s) {
    case "critical": case "high": return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium": return "bg-warning/10 text-warning border-warning/20";
    case "low": return "bg-success/10 text-success border-success/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const difficultyBadge = (d?: string) => {
  switch (d) {
    case "Easy": return "bg-success/10 text-success border-success/20";
    case "Medium": return "bg-warning/10 text-warning border-warning/20";
    case "Advanced": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "";
  }
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Failed to copy"); }
    }} className="gap-1.5 text-xs h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200">
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

function CodeBlock({ code, title, icon }: { code: string; title: string; icon: React.ReactNode }) {
  return (
    <CollapsibleSection title={title} icon={icon} defaultOpen>
      <div className="relative group">
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <CopyButton text={code} />
        </div>
        <pre className="code-block overflow-x-auto rounded-xl"><code>{code}</code></pre>
      </div>
    </CollapsibleSection>
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
    <Button variant="ghost" size="sm" onClick={handleVoice} className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
      {speaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      {speaking ? "Stop" : "Listen"}
    </Button>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = true, accentColor }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`shadow-sm border-border/20 bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-border/30 ${accentColor ? `border-l-2 ${accentColor}` : ''}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/15 transition-colors duration-300 group px-6 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px] font-semibold flex items-center gap-2.5 tracking-tight text-foreground/80">{icon}{title}</CardTitle>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/30 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-6 pb-6">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
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
      <CollapsibleSection title="Generated Tests" icon={<TestTube className="h-4 w-4 text-primary" />} defaultOpen>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">{tests.framework}</Badge>
            <CopyButton text={tests.testCode} label="Copy Tests" />
          </div>
          {tests.testDescriptions?.length > 0 && (
            <ul className="space-y-1">{tests.testDescriptions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 mt-0.5 text-success shrink-0" />{d}</li>
            ))}</ul>
          )}
          <pre className="code-block"><code>{tests.testCode}</code></pre>
        </div>
      </CollapsibleSection>
    );
  }
  return (
    <Button variant="outline" onClick={generate} disabled={loading} className="gap-2 text-xs shadow-sm">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
      {loading ? "Generating Tests…" : "Generate Unit Tests"}
    </Button>
  );
}

function CodeRunner({ code, language }: { code: string; language: string }) {
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setRunning(true); setOutput(null); setError(null);
    try {
      if (language?.toLowerCase().includes("javascript") || language?.toLowerCase().includes("typescript")) {
        const logs: string[] = [];
        const fakeConsole = { log: (...a: any[]) => logs.push(a.map(String).join(" ")), error: (...a: any[]) => logs.push("ERROR: " + a.map(String).join(" ")), warn: (...a: any[]) => logs.push("WARN: " + a.map(String).join(" ")) };
        const fn = new Function("console", code);
        fn(fakeConsole);
        setOutput(logs.join("\n") || "(no output)");
      } else {
        setError(`Code execution is only available for JavaScript/TypeScript in the browser.`);
      }
    } catch (e: any) {
      setError(e?.message || "Execution failed");
    } finally { setRunning(false); }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={run} disabled={running} className="gap-1.5 text-xs">
        {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
        Run Code
      </Button>
      {output !== null && (
        <pre className="code-block text-[12px] bg-success/5 border-success/20">{output}</pre>
      )}
      {error && (
        <pre className="code-block text-[12px] bg-destructive/5 border-destructive/20 text-destructive">{error}</pre>
      )}
    </div>
  );
}

function ListCard({ title, icon, items, accentColor }: { title: string; icon: React.ReactNode; items: string[]; accentColor?: string }) {
  if (!items?.length) return null;
  return (
    <CollapsibleSection title={title} icon={icon} defaultOpen accentColor={accentColor}>
      <ul className="space-y-2">{items.map((s, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{safeStr(s)}
        </li>
      ))}</ul>
    </CollapsibleSection>
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

  return (
    <div className="space-y-6 animate-slide-up" style={{ '--slide-up-delay': '0ms' } as React.CSSProperties}>
      {/* Similar error */}
      {similarError && (
        <Card className="border-primary/20 bg-accent shadow-sm rounded-2xl">
          <CardContent className="py-4 px-6 flex items-center gap-3">
            <Star className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-foreground">
              <strong>Similar Error Found</strong> — previously analyzed on {new Date(similarError.timestamp).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      )}

      {/* ══ Quick Summary (always at top) ══ */}
      {result.quickSummary && (
        <Card className="shadow-lg border-border/20 bg-gradient-to-br from-accent/50 via-card to-card rounded-2xl overflow-hidden">
          <CardContent className="py-6 px-7 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent mt-0.5 shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-primary font-semibold uppercase tracking-wider mb-2">Root Cause</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{result.quickSummary.rootCause}</p>
              </div>
            </div>
            {result.quickSummary.quickFix && (
              <div className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10 mt-0.5 shrink-0">
                  <Zap className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-mono text-success font-semibold uppercase tracking-wider mb-2">Quick Fix</p>
                  <div className="relative group">
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <CopyButton text={result.quickSummary.quickFix} />
                    </div>
                    <pre className="code-block text-[12px] rounded-xl"><code>{result.quickSummary.quickFix}</code></pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Badge Row */}
      <Card className="shadow-sm border-border/30 glass rounded-2xl">
        <CardContent className="py-3.5 px-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className="font-mono text-[11px] rounded-lg">{result.language || "Unknown"}</Badge>
            {result.framework && result.framework !== "None" && (
              <Badge variant="secondary" className="font-mono text-[11px] gap-1.5 rounded-lg"><Layers className="h-3 w-3" /> {result.framework}</Badge>
            )}
            {result.difficulty && (
              <Badge variant="outline" className={`font-mono text-[11px] gap-1 ${difficultyBadge(result.difficulty)}`}>
                <Shield className="h-3 w-3" /> {result.difficulty}
              </Badge>
            )}
            {result.errorCategory && (
              <Badge variant="outline" className="font-mono text-[11px] gap-1 bg-destructive/10 text-destructive border-destructive/20">
                <Target className="h-3 w-3" /> {result.errorCategory}
              </Badge>
            )}
            {result.platform && <Badge variant="outline" className="font-mono text-[11px]">{result.platform}</Badge>}
            {result.securityScore !== undefined && (
              <Badge variant="outline" className={`font-mono text-[11px] gap-1 ${result.securityScore >= 70 ? severityBadge("low") : result.securityScore >= 40 ? severityBadge("medium") : severityBadge("high")}`}>
                <Lock className="h-3 w-3" /> Security: {result.securityScore}/100
              </Badge>
            )}
            {result.performanceScore !== undefined && (
              <Badge variant="outline" className={`font-mono text-[11px] gap-1 ${result.performanceScore >= 70 ? severityBadge("low") : result.performanceScore >= 40 ? severityBadge("medium") : severityBadge("high")}`}>
                <Gauge className="h-3 w-3" /> Perf: {result.performanceScore}/100
              </Badge>
            )}
            {result.maintainabilityScore !== undefined && (
              <Badge variant="outline" className="font-mono text-[11px] gap-1">
                <Gauge className="h-3 w-3" /> Maintainability: {result.maintainabilityScore}/100
              </Badge>
            )}
            {result.codeQuality && <Badge variant="secondary" className="font-mono text-[11px]">{result.codeQuality}</Badge>}

            <div className="flex items-center gap-1 ml-auto">
              <VoiceButton text={voiceText} />
              {onShare && (
                <Button variant="ghost" size="sm" onClick={onShare} className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
                  <Share2 className="h-3 w-3" /> Share
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {result.difficultyExplanation && <p className="text-xs text-muted-foreground px-1">{result.difficultyExplanation}</p>}

      {/* ══ QA: Bug Report ══ */}
      {result.bugTitle && (
        <CollapsibleSection title="Bug Report" icon={<ClipboardList className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">{result.bugTitle}</h2>
              <CopyButton text={[
                `# ${result.bugTitle}`,
                `\n## Description\n${result.description || ""}`,
                `\n## Steps to Reproduce\n${(result.stepsToReproduce || []).map((s, i) => `${i+1}. ${s}`).join("\n")}`,
                `\n## Expected Result\n${result.expectedResult || ""}`,
                `\n## Actual Result\n${result.actualResult || ""}`,
                `\n## Root Cause\n${result.possibleRootCause || ""}`,
                `\n## Severity: ${result.severity || "Unknown"}\n## Priority: ${result.priority || "Unknown"}`,
              ].join("\n")} label="Copy Report" />
            </div>
            {result.description && <p className="text-sm text-foreground leading-relaxed">{result.description}</p>}

            <div className="flex gap-2 flex-wrap">
              {result.severity && (
                <Badge variant="outline" className={`font-mono text-[11px] gap-1 ${
                  result.severity === "Critical" ? severityBadge("critical") : result.severity === "High" ? severityBadge("high") : result.severity === "Medium" ? severityBadge("medium") : severityBadge("low")
                }`}>
                  <AlertTriangle className="h-3 w-3" /> Severity: {result.severity}
                </Badge>
              )}
              {result.priority && (
                <Badge variant="outline" className={`font-mono text-[11px] gap-1 ${
                  result.priority === "High" ? severityBadge("high") : result.priority === "Medium" ? severityBadge("medium") : severityBadge("low")
                }`}>
                  <Target className="h-3 w-3" /> Priority: {result.priority}
                </Badge>
              )}
            </div>
            {result.severityReason && <p className="text-xs text-muted-foreground">Severity: {result.severityReason}</p>}
            {result.priorityReason && <p className="text-xs text-muted-foreground">Priority: {result.priorityReason}</p>}

            {result.stepsToReproduce && result.stepsToReproduce.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Steps to Reproduce:</p>
                <ol className="space-y-1.5">{result.stepsToReproduce.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-border shrink-0 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>
                    </div>
                    {safeStr(s)}
                  </li>
                ))}</ol>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.expectedResult && (
                <div className="p-3 rounded-lg bg-success/5 border border-success/15">
                  <p className="text-[10px] font-mono text-success mb-1">Expected Result</p>
                  <p className="text-sm text-foreground">{safeStr(result.expectedResult)}</p>
                </div>
              )}
              {result.actualResult && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                  <p className="text-[10px] font-mono text-destructive mb-1">Actual Result</p>
                  <p className="text-sm text-foreground">{safeStr(result.actualResult)}</p>
                </div>
              )}
            </div>

            {result.possibleRootCause && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Possible Root Cause:</p>
                <p className="text-sm text-foreground">{safeStr(result.possibleRootCause)}</p>
              </div>
            )}
            {result.environment && result.environment !== "Unknown" && (
              <p className="text-xs text-muted-foreground">Environment: {result.environment}</p>
            )}
            {result.additionalNotes && <p className="text-xs text-muted-foreground italic">{result.additionalNotes}</p>}
          </div>
        </CollapsibleSection>
      )}

      {/* ══ QA: Test Cases ══ */}
      {result.testCases && result.testCases.length > 0 && (
        <CollapsibleSection title="Generated Test Cases" icon={<TestTubes className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-4">
            {result.coverageSummary && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Total", value: result.coverageSummary.totalCount },
                  { label: "Positive", value: result.coverageSummary.positiveCount },
                  { label: "Negative", value: result.coverageSummary.negativeCount },
                  { label: "Edge", value: result.coverageSummary.edgeCaseCount },
                ].map((m) => (
                  <div key={m.label} className="text-center p-2 rounded-lg bg-muted/30 border border-border/40">
                    <p className="text-lg font-bold text-foreground">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{m.label}</p>
                  </div>
                ))}
              </div>
            )}
            {result.testCases.map((tc, i) => (
              <div key={i} className="space-y-2 border border-border/30 rounded-lg p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-mono text-[10px]">{tc.id}</Badge>
                  <Badge variant="outline" className={`font-mono text-[10px] ${
                    tc.type === "positive" ? severityBadge("low") : tc.type === "negative" ? severityBadge("high") : severityBadge("medium")
                  }`}>{tc.type}</Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">{tc.priority}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{tc.scenario}</p>
                {tc.steps?.length > 0 && (
                  <ol className="space-y-0.5 ml-1">{tc.steps.map((s, j) => (
                    <li key={j} className="text-xs text-muted-foreground">{j+1}. {s}</li>
                  ))}</ol>
                )}
                <p className="text-xs text-foreground"><strong>Expected:</strong> {tc.expectedResult}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ══ QA: Test Scenarios ══ */}
      {result.featureName && (
        <CollapsibleSection title={`Test Scenarios: ${result.featureName}`} icon={<ListChecks className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-4">
            <ListCard title="Functional Scenarios" icon={<CheckCircle2 className="h-4 w-4 text-success" />} items={result.functionalScenarios || []} accentColor="border-l-success" />
            <ListCard title="Edge Case Scenarios" icon={<AlertTriangle className="h-4 w-4 text-warning" />} items={result.edgeCaseScenarios || []} accentColor="border-l-warning" />
            <ListCard title="Negative Scenarios" icon={<Bug className="h-4 w-4 text-destructive" />} items={result.negativeScenarios || []} accentColor="border-l-destructive" />
            <ListCard title="Security Scenarios" icon={<Shield className="h-4 w-4 text-primary" />} items={result.securityScenarios || []} />
            <ListCard title="Performance Scenarios" icon={<Zap className="h-4 w-4 text-warning" />} items={result.performanceScenarios || []} />
          </div>
        </CollapsibleSection>
      )}

      {/* Extracted error from terminal */}
      {result.extractedError && (
        <CollapsibleSection title="Extracted Error" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <pre className="code-block">{result.extractedError}</pre>
        </CollapsibleSection>
      )}

      {/* Stack Trace Analysis */}
      {result.stackTraceAnalysis && (
        <CollapsibleSection title="Stack Trace Analysis" icon={<FileCode className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm font-mono">
            <span className="text-muted-foreground">Root File:</span><span className="text-foreground font-medium">{result.stackTraceAnalysis.rootCauseFile}</span>
            <span className="text-muted-foreground">Line:</span><span className="text-foreground font-medium">{result.stackTraceAnalysis.problemLine}</span>
            <span className="text-muted-foreground">Reason:</span><span className="text-foreground">{safeStr(result.stackTraceAnalysis.reason)}</span>
            <span className="text-muted-foreground">Fix:</span><span className="text-foreground">{safeStr(result.stackTraceAnalysis.suggestedFix)}</span>
          </div>
        </CollapsibleSection>
      )}

      {/* API Status Code */}
      {result.statusCode && result.statusMeaning && (
        <CollapsibleSection title={`HTTP ${result.statusCode}`} icon={<Globe className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <p className="text-sm text-foreground">{result.statusMeaning}</p>
        </CollapsibleSection>
      )}

      {/* Dependency Fix */}
      {result.dependencyFix?.detected && (
        <CollapsibleSection title="Dependency Fix" icon={<Package className="h-4 w-4 text-warning" />} defaultOpen accentColor="border-l-warning">
          <div className="space-y-3">
            <p className="text-sm text-foreground">{result.dependencyFix.explanation}</p>
            {result.dependencyFix.installCommands && (
              <div className="space-y-2">{Object.entries(result.dependencyFix.installCommands).map(([mgr, cmd]) => (
                <div key={mgr} className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{mgr}</Badge>
                  <code className="flex-1 text-xs font-mono bg-muted/50 border border-border rounded-md px-3 py-1.5 text-foreground">{cmd}</code>
                  <CopyButton text={cmd} />
                </div>
              ))}</div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Summary / Explanation */}
      {(result.summary || result.explanation) && (
        <CollapsibleSection
          title={result.summary && isReview ? "Review Summary" : "Explanation"}
          icon={<Lightbulb className="h-4 w-4 text-warning" />}
          defaultOpen
        >
          <p className="text-sm text-foreground leading-relaxed">{safeStr(result.summary || result.explanation)}</p>
        </CollapsibleSection>
      )}

      {/* Causes */}
      <ListCard title="Why This Happens" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} items={result.causes} accentColor="border-l-destructive" />

      {/* Vulnerabilities (Security mode) */}
      {result.vulnerabilities && result.vulnerabilities.length > 0 && (
        <CollapsibleSection title="Security Vulnerabilities" icon={<Lock className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <div className="space-y-3">{result.vulnerabilities.map((v, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityBadge(v.severity)}`}>{v.severity}</Badge>
                <div>
                  <p className="text-sm font-medium text-foreground">{v.type}{v.cwe ? ` (${v.cwe})` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                  {v.line && <p className="text-xs text-muted-foreground font-mono">Line {v.line}</p>}
                  <p className="text-xs text-foreground mt-1"><strong>Fix:</strong> {v.fix}</p>
                </div>
              </div>
              {i < result.vulnerabilities!.length - 1 && <div className="border-t border-border/30 mt-2" />}
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Performance Issues */}
      {result.issues && result.issues.length > 0 && (
        <CollapsibleSection title="Performance Issues" icon={<Zap className="h-4 w-4 text-warning" />} defaultOpen accentColor="border-l-warning">
          <div className="space-y-3">{result.issues.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityBadge(p.severity)}`}>{p.severity}</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">{p.type}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                {p.line && <p className="text-xs text-muted-foreground font-mono">Line {p.line}</p>}
                <p className="text-xs text-foreground mt-1"><strong>Fix:</strong> {p.fix}</p>
                {p.impact && <p className="text-xs text-muted-foreground">Impact: {p.impact}</p>}
              </div>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Complexity Analysis */}
      {result.complexityAnalysis && (
        <CollapsibleSection title="Complexity Analysis" icon={<Gauge className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm font-mono">
            {result.complexityAnalysis.timeComplexity && <><span className="text-muted-foreground">Time:</span><span className="text-foreground">{result.complexityAnalysis.timeComplexity}</span></>}
            {result.complexityAnalysis.spaceComplexity && <><span className="text-muted-foreground">Space:</span><span className="text-foreground">{result.complexityAnalysis.spaceComplexity}</span></>}
            {result.complexityAnalysis.before && <><span className="text-muted-foreground">Before:</span><span className="text-foreground">{result.complexityAnalysis.before}</span></>}
            {result.complexityAnalysis.after && <><span className="text-muted-foreground">After:</span><span className="text-foreground">{result.complexityAnalysis.after}</span></>}
            {result.complexityAnalysis.explanation && <><span className="text-muted-foreground">Details:</span><span className="text-foreground">{result.complexityAnalysis.explanation}</span></>}
          </div>
        </CollapsibleSection>
      )}

      {/* Metrics */}
      {result.metrics && (
        <CollapsibleSection title="Code Metrics" icon={<Gauge className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.cyclomaticComplexity !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{result.cyclomaticComplexity}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">Cyclomatic</p>
              </div>
            )}
            {result.metrics.cognitiveComplexity !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{result.metrics.cognitiveComplexity}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">Cognitive</p>
              </div>
            )}
            {result.metrics.linesOfCode !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{result.metrics.linesOfCode}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">Lines</p>
              </div>
            )}
            {result.metrics.functionCount !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{result.metrics.functionCount}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">Functions</p>
              </div>
            )}
            {result.metrics.nestingDepth !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-2xl font-bold text-foreground">{result.metrics.nestingDepth}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">Max Nesting</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Hotspots */}
      {result.hotspots && result.hotspots.length > 0 && (
        <CollapsibleSection title="Complexity Hotspots" icon={<Target className="h-4 w-4 text-destructive" />} defaultOpen>
          <div className="space-y-2">{result.hotspots.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityBadge(h.complexity)}`}>{h.complexity}</Badge>
              <div><p className="text-sm font-medium text-foreground font-mono">{h.location}</p><p className="text-xs text-muted-foreground">{h.suggestion}</p></div>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Line Explanations */}
      {result.lineExplanations && result.lineExplanations.length > 0 && (
        <CollapsibleSection title="Line-by-Line Explanation" icon={<BookOpen className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-4">{result.lineExplanations.map((le, i) => (
            <div key={i} className="space-y-1.5">
              <Badge variant="secondary" className="font-mono text-[10px]">Lines {le.lines}</Badge>
              <pre className="code-block text-[12px]">{le.code}</pre>
              <p className="text-sm text-muted-foreground pl-1">{le.explanation}</p>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Flow Description */}
      {result.flowDescription && result.flowDescription.length > 0 && (
        <CollapsibleSection title="Execution Flow" icon={<TrendingUp className="h-4 w-4 text-primary" />} defaultOpen>
          <ol className="space-y-2">{result.flowDescription.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px] mt-0.5">{i + 1}</Badge>{s}
            </li>
          ))}</ol>
        </CollapsibleSection>
      )}

      <ListCard title="Key Concepts" icon={<GraduationCap className="h-4 w-4 text-primary" />} items={result.keyConceptsCovered || []} />

      {/* SQL Syntax Errors */}
      {result.syntaxErrors && result.syntaxErrors.length > 0 && (
        <CollapsibleSection title="SQL Syntax Errors" icon={<Database className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <div className="space-y-2">{result.syntaxErrors.map((e, i) => (
            <div key={i}><p className="text-sm text-foreground">{e.description}</p><p className="text-xs text-primary font-mono mt-1">Fix: {e.fix}</p></div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* SQL Performance Issues */}
      {result.performanceIssues && result.performanceIssues.length > 0 && (
        <CollapsibleSection title="Query Performance" icon={<Zap className="h-4 w-4 text-warning" />} defaultOpen>
          <div className="space-y-2">{result.performanceIssues.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              {p.impact && <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityBadge(p.impact)}`}>{p.impact}</Badge>}
              <div><p className="text-sm text-foreground">{p.issue}</p><p className="text-xs text-muted-foreground">{p.suggestion}</p></div>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      <ListCard title="Header Issues" icon={<Globe className="h-4 w-4 text-warning" />} items={result.headerIssues || []} />
      <ListCard title="Parameter Issues" icon={<Globe className="h-4 w-4 text-warning" />} items={result.parameterIssues || []} />

      {result.curlExample && <CodeBlock code={result.curlExample} title="Working curl Example" icon={<Code className="h-4 w-4 text-primary" />} />}

      {/* Critical Errors (Log mode) */}
      {result.criticalErrors && result.criticalErrors.length > 0 && (
        <CollapsibleSection title="Critical Errors" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <div className="space-y-3">{result.criticalErrors.map((e, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-sm font-medium text-foreground font-mono">{e.message}</p>
              {e.timestamp && <p className="text-xs text-muted-foreground">Time: {e.timestamp}</p>}
              {e.source && <p className="text-xs text-muted-foreground">Source: {e.source}</p>}
              <p className="text-xs text-foreground">{e.explanation}</p>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Log Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <CollapsibleSection title="Warnings" icon={<FileWarning className="h-4 w-4 text-warning" />} defaultOpen={false}>
          <div className="space-y-2">{result.warnings.map((w, i) => (
            <div key={i}><p className="text-sm text-foreground">{w.message}</p><p className="text-xs text-muted-foreground">{w.significance}</p></div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Root Cause */}
      {result.rootCause && (
        <CollapsibleSection title="Root Cause" icon={<Target className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-2">
            <p className="text-sm text-foreground">{safeStr(result.rootCause.description)}</p>
            <p className="text-xs text-muted-foreground">Evidence: {safeStr(result.rootCause.evidence)}</p>
            <p className="text-xs text-foreground"><strong>Fix:</strong> {safeStr(result.rootCause.suggestedFix)}</p>
          </div>
        </CollapsibleSection>
      )}

      {/* Timeline */}
      {result.timeline && result.timeline.length > 0 && (
        <CollapsibleSection title="Event Timeline" icon={<Clock className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-2 relative before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-border/50">
            {result.timeline.map((t, i) => (
              <div key={i} className="flex items-center gap-3 pl-1">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] ${severityBadge(t.severity)}`}>{t.severity}</Badge>
                {t.time && <span className="text-xs text-muted-foreground font-mono shrink-0">{t.time}</span>}
                <span className="text-sm text-foreground">{safeStr(t.event)}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Debug Simulation */}
      {result.debugSimulation && result.debugSimulation.length > 0 && (
        <CollapsibleSection title="Debug Simulation" icon={<Bug className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-3">{result.debugSimulation.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                <span className="text-[10px] font-bold text-primary">{s.step}</span>
              </div>
              <div>
                <p className="text-sm text-foreground">{safeStr(s.description)}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">State: {safeStr(s.state)}</p>
              </div>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Execution Path */}
      {result.executionPath && result.executionPath.length > 0 && (
        <CollapsibleSection title="Execution Path" icon={<TrendingUp className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-2 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border/50">
            {result.executionPath.map((step, i) => (
              <div key={i} className="flex items-start gap-3 pl-1">
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0 z-10">
                  <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-sm text-foreground font-mono">{safeStr(step)}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Affected Files */}
      {result.affectedFiles && result.affectedFiles.length > 0 && (
        <CollapsibleSection title="Affected Files" icon={<FileCode className="h-4 w-4 text-warning" />} defaultOpen>
          <div className="space-y-2">{result.affectedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] ${f.role.includes("origin") ? severityBadge("high") : severityBadge("medium")}`}>{f.role}</Badge>
              <span className="font-mono text-foreground">{f.file}</span>
              {f.line && <span className="text-xs text-muted-foreground font-mono">:{f.line}</span>}
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Code Diff Changes */}
      {result.changes && result.changes.length > 0 && (
        <CollapsibleSection title="Code Changes" icon={<ArrowRightLeft className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-3">{result.changes.map((c, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`font-mono text-[10px] ${c.type === "added" ? severityBadge("low") : c.type === "removed" ? severityBadge("high") : severityBadge("medium")}`}>{c.type}</Badge>
                <span className="text-sm text-foreground">{safeStr(c.description)}</span>
              </div>
              {c.oldCode && <pre className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 font-mono text-xs text-foreground">- {c.oldCode}</pre>}
              {c.newCode && <pre className="rounded-lg bg-success/5 border border-success/15 p-3 font-mono text-xs text-foreground">+ {c.newCode}</pre>}
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Bug Introduced Warning */}
      {result.bugIntroduced && result.bugExplanation && (
        <CollapsibleSection title="Bug Introduced!" icon={<Bug className="h-4 w-4 text-destructive" />} defaultOpen accentColor="border-l-destructive">
          <p className="text-sm text-foreground">{result.bugExplanation}</p>
        </CollapsibleSection>
      )}

      {/* Breaking Changes */}
      {result.breakingChanges && result.breakingChanges.length > 0 && (
        <CollapsibleSection title="Breaking Changes" icon={<AlertTriangle className="h-4 w-4 text-warning" />} defaultOpen accentColor="border-l-warning">
          <div className="space-y-3">{result.breakingChanges.map((bc, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm text-foreground">{bc.description}</p>
              <pre className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 font-mono text-xs text-foreground">- {bc.oldSyntax}</pre>
              <pre className="rounded-lg bg-success/5 border border-success/15 p-3 font-mono text-xs text-foreground">+ {bc.newSyntax}</pre>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      <ListCard title="Migration Steps" icon={<ArrowRightLeft className="h-4 w-4 text-primary" />} items={result.migrationSteps || []} />
      <ListCard title="Deprecations" icon={<AlertTriangle className="h-4 w-4 text-warning" />} items={result.deprecations || []} />

      {/* Interview Questions */}
      {result.questions && result.questions.length > 0 && (
        <CollapsibleSection title="Interview Questions" icon={<GraduationCap className="h-4 w-4 text-primary" />} defaultOpen={false}>
          <div className="space-y-4">{result.questions.map((q, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityBadge(q.difficulty === "easy" ? "low" : q.difficulty === "hard" ? "high" : "medium")}`}>{q.difficulty}</Badge>
                <p className="text-sm font-medium text-foreground">{q.question}</p>
              </div>
              <details className="pl-12">
                <summary className="text-xs text-primary cursor-pointer font-mono hover:underline">Show Answer</summary>
                <p className="text-sm text-muted-foreground mt-1">{q.answer}</p>
                {q.followUp && <p className="text-xs text-muted-foreground mt-1 italic">Follow-up: {q.followUp}</p>}
              </details>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      <ListCard title="Key Takeaways" icon={<Star className="h-4 w-4 text-primary" />} items={result.keyTakeaways || []} />
      <ListCard title="Common Mistakes" icon={<AlertTriangle className="h-4 w-4 text-warning" />} items={result.commonMistakes || []} />

      {/* Function Docs */}
      {result.functionDocs && result.functionDocs.length > 0 && (
        <CollapsibleSection title="Function Documentation" icon={<FileText className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-4">{result.functionDocs.map((fd, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm font-medium text-foreground font-mono">{fd.name}</p>
              <p className="text-xs text-muted-foreground">{fd.description}</p>
              {fd.params?.length > 0 && (
                <div className="ml-2 space-y-0.5">{fd.params.map((p, j) => (
                  <p key={j} className="text-xs font-mono text-foreground"><span className="text-primary">@param</span> {p.name}: {p.type} — {p.description}</p>
                ))}</div>
              )}
              <p className="text-xs font-mono text-foreground"><span className="text-primary">@returns</span> {fd.returns}</p>
              {fd.example && <pre className="code-block text-[12px]">{fd.example}</pre>}
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {result.readme && <CodeBlock code={result.readme} title="Generated README" icon={<FileText className="h-4 w-4 text-primary" />} />}

      {/* Usage Examples */}
      {result.usageExamples && result.usageExamples.length > 0 && (
        <CollapsibleSection title="Usage Examples" icon={<Code className="h-4 w-4 text-primary" />} defaultOpen>
          <div className="space-y-3">{result.usageExamples.map((ex, i) => (
            <div key={i} className="relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><CopyButton text={ex} /></div>
              <pre className="code-block">{ex}</pre>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Reproduce Bug */}
      {result.minimalExample && (
        <>
          {result.expectedBehavior && result.actualBehavior && (
            <CollapsibleSection title="Bug Analysis" icon={<Bug className="h-4 w-4 text-primary" />} defaultOpen>
              <div className="space-y-3">
                <div><p className="text-xs font-mono text-muted-foreground mb-0.5">Expected:</p><p className="text-sm text-foreground">{result.expectedBehavior}</p></div>
                <div><p className="text-xs font-mono text-muted-foreground mb-0.5">Actual:</p><p className="text-sm text-foreground">{result.actualBehavior}</p></div>
              </div>
            </CollapsibleSection>
          )}
          <CodeBlock code={result.minimalExample} title="Minimal Reproducible Example" icon={<Bug className="h-4 w-4 text-primary" />} />
        </>
      )}

      <ListCard title="Debug Steps" icon={<List className="h-4 w-4 text-primary" />} items={result.debugSteps || []} />
      <ListCard title="Environment Issues" icon={<Wrench className="h-4 w-4 text-warning" />} items={result.environmentIssues || []} />

      {/* Version Issues */}
      {result.versionIssues && result.versionIssues.length > 0 && (
        <CollapsibleSection title="Version Issues" icon={<Package className="h-4 w-4 text-warning" />} defaultOpen>
          <div className="space-y-2">{result.versionIssues.map((v, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px] mt-0.5">{v.package}</Badge>
              <div>
                {v.currentVersion && <p className="text-xs text-muted-foreground">Current: {v.currentVersion}</p>}
                <p className="text-xs text-foreground">Required: {v.requiredVersion}</p>
                <p className="text-xs text-primary font-mono">{v.fix}</p>
              </div>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      <ListCard title="Checklist" icon={<CheckCircle2 className="h-4 w-4 text-success" />} items={result.setupChecklist || result.checklist || []} />

      {/* Fixes */}
      {result.fixes?.length > 0 && (
        <CollapsibleSection title="Possible Fixes" icon={<Zap className="h-4 w-4 text-success" />} defaultOpen accentColor="border-l-success">
          <div className="space-y-4">
            {hasStructuredFixes
              ? (result.fixes as FixOption[]).map((fix, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5 bg-success/10 text-success border-success/20">Fix {i + 1}</Badge>
                      <div className="space-y-1"><p className="text-sm font-medium text-foreground">{fix.title}</p><p className="text-sm text-muted-foreground">{fix.description}</p></div>
                    </div>
                    {fix.code && (
                      <div className="ml-12 relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><CopyButton text={fix.code} /></div>
                        <pre className="code-block"><code>{fix.code}</code></pre>
                      </div>
                    )}
                    {i < (result.fixes as FixOption[]).length - 1 && <div className="border-t border-border/30 pt-2" />}
                  </div>
                ))
              : (result.fixes as string[]).map((fix, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5 bg-success/10 text-success border-success/20">{i + 1}</Badge>{safeStr(fix)}
                  </div>
                ))}
          </div>
        </CollapsibleSection>
      )}

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
          title={isReview ? "Improved Code" : "Corrected Code"}
          icon={<Wand2 className="h-4 w-4 text-success" />}
        />
      )}

      {/* Code Runner for corrected code */}
      {(result.correctedCode || result.improvedCode) && (
        <div className="px-1">
          <CodeRunner code={result.improvedCode || result.correctedCode} language={result.language} />
        </div>
      )}

      {/* Bug-Specific Tests */}
      {result.bugSpecificTests && result.bugSpecificTests.length > 0 && (
        <CollapsibleSection title="Bug-Specific Tests" icon={<TestTube className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-3">
            {result.bugSpecificTests.map((test, i) => (
              <div key={i} className="relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <CopyButton text={test} />
                </div>
                <pre className="code-block text-[12px]"><code>{test}</code></pre>
                <CodeRunner code={test} language={result.language} />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Contextual Suggestions */}
      {result.contextualSuggestions && (
        <CollapsibleSection title="Smart Suggestions" icon={<Lightbulb className="h-4 w-4 text-warning" />} defaultOpen={false}>
          <div className="space-y-4">
            <ListCard title="Best Practices" icon={<CheckCircle2 className="h-4 w-4 text-success" />} items={result.contextualSuggestions.bestPractices || []} accentColor="border-l-success" />
            <ListCard title="Common Mistakes to Avoid" icon={<AlertTriangle className="h-4 w-4 text-warning" />} items={result.contextualSuggestions.commonMistakes || []} accentColor="border-l-warning" />
            {result.contextualSuggestions.interviewTip && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-mono text-primary font-semibold uppercase tracking-wider">Interview Tip</p>
                </div>
                <p className="text-sm text-foreground">{result.contextualSuggestions.interviewTip}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {result.queryPlan && (
        <CollapsibleSection title="Query Plan" icon={<Database className="h-4 w-4 text-primary" />} defaultOpen>
          <p className="text-sm text-foreground">{result.queryPlan}</p>
        </CollapsibleSection>
      )}

      {/* Bug Warnings */}
      {result.bugWarnings && result.bugWarnings.length > 0 && (
        <CollapsibleSection title="Smart Bug Prevention" icon={<Bug className="h-4 w-4 text-warning" />} defaultOpen accentColor="border-l-warning">
          <div className="space-y-3">{result.bugWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] mt-0.5 ${severityBadge(w.severity)}`}>{w.severity}</Badge>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground capitalize">{w.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{w.description}</p>
                {w.line && <p className="text-xs text-muted-foreground font-mono">Line {w.line}</p>}
              </div>
            </div>
          ))}</div>
        </CollapsibleSection>
      )}

      {/* Learn the Concept */}
      {result.learningConcept && (
        <CollapsibleSection title={`Learn: ${result.learningConcept.title}`} icon={<GraduationCap className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">{result.learningConcept.explanation}</p>
            {result.learningConcept.example && <pre className="code-block"><code>{result.learningConcept.example}</code></pre>}
            {result.learningConcept.bestPractices?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Best Practices:</p>
                <ul className="space-y-1.5">{result.learningConcept.bestPractices.map((bp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />{safeStr(bp)}</li>
                ))}</ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Debug Checklist */}
      {result.debugChecklist && result.debugChecklist.length > 0 && (
        <CollapsibleSection title="Debugging Checklist" icon={<List className="h-4 w-4 text-primary" />} defaultOpen>
          <ol className="space-y-2">{result.debugChecklist.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <div className="flex h-5 w-5 items-center justify-center rounded border border-border shrink-0 mt-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>
              </div>
              {safeStr(s)}
            </li>
          ))}</ol>
        </CollapsibleSection>
      )}

      {/* Patch Diff */}
      {result.patchDiff && (
        <CollapsibleSection title="Patch / Diff" icon={<GitCompare className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <CopyButton text={result.patchDiff} label="Copy Diff" />
            </div>
            <pre className="code-block overflow-x-auto text-[12px] leading-relaxed">
              {result.patchDiff.split("\n").map((line, i) => {
                let cls = "text-foreground";
                if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-success";
                else if (line.startsWith("-") && !line.startsWith("---")) cls = "text-destructive";
                else if (line.startsWith("@@")) cls = "text-primary";
                else if (line.startsWith("---") || line.startsWith("+++")) cls = "text-muted-foreground font-semibold";
                return <span key={i} className={cls}>{line}{"\n"}</span>;
              })}
            </pre>
          </div>
        </CollapsibleSection>
      )}

      {/* Pull Request Suggestion */}
      {result.pullRequestSuggestion && (
        <CollapsibleSection title="Pull Request Draft" icon={<GitCommit className="h-4 w-4 text-primary" />} defaultOpen accentColor="border-l-primary">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-semibold text-foreground bg-muted/30 px-2.5 py-1 rounded border border-border/40 flex-1">{result.pullRequestSuggestion.title}</code>
              <CopyButton text={result.pullRequestSuggestion.title} label="Copy" />
            </div>
            <div className="relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <CopyButton text={result.pullRequestSuggestion.description} label="Copy Body" />
              </div>
              <pre className="code-block overflow-x-auto text-[12px] whitespace-pre-wrap">{result.pullRequestSuggestion.description}</pre>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Commit Message */}
      {result.commitMessage && (
        <Card className="shadow-sm border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <GitCommit className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <code className="text-xs text-foreground font-mono flex-1 min-w-0 truncate bg-muted/30 px-2 py-1 rounded">{result.commitMessage}</code>
              <CopyButton text={result.commitMessage} label="Copy" />
            </div>
          </CardContent>
        </Card>
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
        <CollapsibleSection title="Resources" icon={<Globe className="h-4 w-4 text-primary" />} defaultOpen={false}>
          <ul className="space-y-3">{result.resources.map((res, i) => (
            <li key={i}>
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline transition-colors">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm">{res.title}</span>
              </a>
              <span className="text-xs text-muted-foreground ml-6 capitalize">{res.type === "stackoverflow" ? "Stack Overflow" : res.type}</span>
            </li>
          ))}</ul>
        </CollapsibleSection>
      )}
    </div>
  );
};
