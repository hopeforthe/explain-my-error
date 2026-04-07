import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, Code, Send, Loader2, LogOut, Terminal,
  PanelLeftClose, PanelLeft, PlusCircle, History, MessageSquare,
  FileCode, Sparkles, BarChart3, Shield, Zap, BookOpen, Database,
  Globe, Wrench, FileText, GitCompare, Bug, Gauge, Cog,
  ArrowRightLeft, GraduationCap, Layers, Rocket,
  ClipboardList, TestTubes, ListChecks, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ResultDisplay, type ExplanationResult } from "@/components/ResultDisplay";
import { ImageUpload } from "@/components/ImageUpload";
import { DebugChat } from "@/components/DebugChat";
import { ErrorHistory } from "@/components/ErrorHistory";
import { ErrorTrends } from "@/components/ErrorTrends";
import { SnippetLibrary } from "@/components/SnippetLibrary";
import { addErrorHistory, findSimilarError } from "@/lib/errorHistory";
import type { Session } from "@supabase/supabase-js";

const FREE_QUERY_KEY = "eme_free_query_count";
const MAX_FREE_QUERIES = 10;

type SidebarPanel = "new" | "history" | "chat" | "trends" | "snippets";
type InputMode = string;

interface ModeConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  category: string;
}

const inputModes: ModeConfig[] = [
  { id: "error", label: "Error", icon: <AlertTriangle className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste your error message or stack trace here…\n\ne.g. TypeError: Cannot read properties of undefined (reading 'map')" },
  { id: "code", label: "Bug Detect", icon: <Bug className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste your source code here to detect bugs…" },
  { id: "terminal", label: "Terminal", icon: <Terminal className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste your full terminal output here…" },
  { id: "api", label: "API Error", icon: <Globe className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste API error responses, curl commands, or HTTP errors here…" },
  { id: "log", label: "Log File", icon: <FileText className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste log file contents (server.log, error.log, docker logs)…" },
  { id: "sql", label: "SQL Debug", icon: <Database className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste SQL queries or database error messages here…" },
  { id: "cicd", label: "CI/CD", icon: <Cog className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste CI/CD pipeline errors (GitHub Actions, Docker, Jenkins)…" },
  { id: "deploy", label: "Deploy", icon: <Rocket className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste deployment errors from Vercel, Netlify, AWS, Docker…" },
  { id: "env", label: "Environment", icon: <Wrench className="h-3.5 w-3.5" />, category: "Analyze",
    placeholder: "Paste environment errors (version mismatch, missing packages)…" },
  { id: "review", label: "Code Review", icon: <Sparkles className="h-3.5 w-3.5" />, category: "Improve",
    placeholder: "Paste code to get improvement suggestions…" },
  { id: "refactor", label: "Refactor", icon: <Layers className="h-3.5 w-3.5" />, category: "Improve",
    placeholder: "Paste code to get refactoring suggestions…" },
  { id: "security", label: "Security Scan", icon: <Shield className="h-3.5 w-3.5" />, category: "Improve",
    placeholder: "Paste code to scan for security vulnerabilities…" },
  { id: "performance", label: "Performance", icon: <Zap className="h-3.5 w-3.5" />, category: "Improve",
    placeholder: "Paste code to analyze performance…" },
  { id: "complexity", label: "Complexity", icon: <Gauge className="h-3.5 w-3.5" />, category: "Improve",
    placeholder: "Paste code to analyze its complexity metrics…" },
  { id: "explain", label: "Explain Code", icon: <BookOpen className="h-3.5 w-3.5" />, category: "Generate",
    placeholder: "Paste code for a line-by-line explanation…" },
  { id: "docs", label: "Generate Docs", icon: <FileCode className="h-3.5 w-3.5" />, category: "Generate",
    placeholder: "Paste code to automatically generate documentation…" },
  { id: "reproduce", label: "Reproduce Bug", icon: <Bug className="h-3.5 w-3.5" />, category: "Generate",
    placeholder: "Paste buggy code to generate a minimal reproducible example…" },
  { id: "interview", label: "Interview Prep", icon: <GraduationCap className="h-3.5 w-3.5" />, category: "Generate",
    placeholder: "Paste code or error to generate interview-style questions…" },
  { id: "diff", label: "Code Diff", icon: <GitCompare className="h-3.5 w-3.5" />, category: "Compare",
    placeholder: "Paste two versions separated by:\n--- OLD CODE ---\n(old code)\n--- NEW CODE ---\n(new code)" },
  { id: "migrate", label: "Migrate", icon: <ArrowRightLeft className="h-3.5 w-3.5" />, category: "Compare",
    placeholder: "Paste code and specify the migration target." },
  { id: "bugreport", label: "Bug Report", icon: <ClipboardList className="h-3.5 w-3.5" />, category: "Tester Tools",
    placeholder: "Paste an error message, failure log, or bug description…" },
  { id: "testcase", label: "Test Cases", icon: <TestTubes className="h-3.5 w-3.5" />, category: "Tester Tools",
    placeholder: "Describe a feature or module to generate test cases…" },
  { id: "testscenario", label: "Scenarios", icon: <ListChecks className="h-3.5 w-3.5" />, category: "Tester Tools",
    placeholder: "Enter a feature or module name to generate test scenarios…" },
];

const categories = ["Analyze", "Improve", "Generate", "Compare", "Tester Tools"];

const categoryIcons: Record<string, React.ReactNode> = {
  Analyze: <Bug className="h-3.5 w-3.5" />,
  Improve: <Sparkles className="h-3.5 w-3.5" />,
  Generate: <FileCode className="h-3.5 w-3.5" />,
  Compare: <GitCompare className="h-3.5 w-3.5" />,
  "Tester Tools": <TestTubes className="h-3.5 w-3.5" />,
};

const Index = () => {
  const [errorInput, setErrorInput] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [freeQueryCount, setFreeQueryCount] = useState(() => {
    const stored = localStorage.getItem(FREE_QUERY_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("new");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("error");
  const [activeCategory, setActiveCategory] = useState("Analyze");
  const [analysisMode, setAnalysisMode] = useState<"simple" | "explain" | "deep">("explain");
  const [outputLength, setOutputLength] = useState<"short" | "medium" | "detailed">("medium");
  const [outputLang, setOutputLang] = useState("en");
  const [similarError, setSimilarError] = useState<{ errorMessage: string; timestamp: number } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setSidebarOpen(false);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSubmit = async () => {
    if (!errorInput.trim()) { toast.error("Please paste some input first."); return; }
    if (!session && freeQueryCount >= MAX_FREE_QUERIES) { setShowAuthModal(true); return; }

    setLoading(true);
    setResult(null);
    setSimilarError(null);

    const similar = findSimilarError(errorInput.trim());
    if (similar) setSimilarError({ errorMessage: similar.errorMessage, timestamp: similar.timestamp });

    try {
      const { data, error } = await supabase.functions.invoke("explain-error", {
        body: { errorMessage: errorInput.trim(), inputMode, analysisMode, outputLength, outputLanguage: outputLang },
      });
      if (error) throw error;

      if (!session) {
        const newCount = freeQueryCount + 1;
        localStorage.setItem(FREE_QUERY_KEY, String(newCount));
        setFreeQueryCount(newCount);
      }

      const parsed = data as ExplanationResult;
      setResult(parsed);
      addErrorHistory(errorInput.trim(), parsed.language || "Unknown", parsed.framework);
      setHistoryRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const { data, error } = await supabase.functions.invoke("share-debug", {
        body: { input: errorInput, inputMode, result },
      });
      if (error) throw error;
      const shareUrl = `${window.location.origin}/debug/${data.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create share link.");
    }
  };

  const handleNewError = useCallback(() => {
    setErrorInput(""); setResult(null); setSimilarError(null); setActivePanel("new");
  }, []);

  const handleHistorySelect = useCallback((errorMessage: string) => {
    setErrorInput(errorMessage); setResult(null); setSimilarError(null);
    setActivePanel("new"); setInputMode("error"); setActiveCategory("Analyze");
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const currentMode = inputModes.find((m) => m.id === inputMode)!;
  const modesInCategory = inputModes.filter(m => m.category === activeCategory);
  const reviewModes = ["review", "refactor", "security", "performance", "complexity"];
  const isReview = reviewModes.includes(inputMode);

  const submitLabels: Record<string, string> = {
    error: "Explain Error", code: "Analyze Code", terminal: "Clean & Explain",
    review: "Review Code", refactor: "Refactor Code", security: "Scan Security",
    performance: "Analyze Performance", explain: "Explain Code", sql: "Debug SQL",
    api: "Debug API", log: "Analyze Logs", cicd: "Debug CI/CD", deploy: "Debug Deploy",
    docs: "Generate Docs", diff: "Analyze Diff", reproduce: "Reproduce Bug",
    complexity: "Analyze Complexity", env: "Debug Environment", migrate: "Migrate Code",
    interview: "Generate Questions", bugreport: "Generate Report", testcase: "Generate Tests",
    testscenario: "Generate Scenarios",
  };
  const submitLabel = submitLabels[inputMode] || "Analyze";

  const sidebarItems: { id: SidebarPanel; label: string; icon: React.ReactNode }[] = [
    { id: "new", label: "New Analysis", icon: <PlusCircle className="h-4 w-4" /> },
    { id: "history", label: "History", icon: <History className="h-4 w-4" /> },
    { id: "chat", label: "Debug Chat", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "snippets", label: "Snippets", icon: <BookOpen className="h-4 w-4" /> },
    { id: "trends", label: "Trends", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const remaining = MAX_FREE_QUERIES - freeQueryCount;

  return (
    <div className="h-screen flex flex-col bg-gradient-dark transition-colors duration-300 overflow-x-hidden overflow-y-hidden">
      {/* ─── Header ─── */}
      <header className="shrink-0 z-50 border-b border-border/50 glass">
        <div className="flex items-center justify-between px-5 h-[56px]">
          <div className="flex items-center gap-3.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient-primary shadow-lg shadow-primary/25">
                <Terminal className="h-[18px] w-[18px] text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-[15px] text-foreground tracking-tight leading-tight">Explain My Error</h1>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">AI Debugging Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <div className="flex items-center gap-2.5">
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-semibold border-primary/20 bg-primary/10 text-primary rounded-lg px-2.5 py-0.5">
                  Pro · Unlimited
                </Badge>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200" onClick={() => supabase.auth.signOut()} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {remaining > 0 && (
                  <div className="hidden sm:flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-1.5 border border-border/40">
                    <div className="flex gap-[3px]">
                      {Array.from({ length: MAX_FREE_QUERIES }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                            i < remaining ? "bg-primary shadow-sm shadow-primary/30" : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">{remaining} left</span>
                  </div>
                )}
                {remaining <= 0 && (
                  <Badge variant="destructive" className="hidden sm:inline-flex text-[10px] rounded-lg">
                    Limit reached
                  </Badge>
                )}
                <Button
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold rounded-xl btn-gradient-primary text-primary-foreground"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign in
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─── */}
        <aside
          className={`shrink-0 border-r border-border/40 glass flex flex-col transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-64 max-w-[75vw]" : "w-0 overflow-hidden"
          }`}
        >
          <nav className="p-3.5 space-y-0.5">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition-all duration-200 group ${
                  activePanel === item.id
                    ? "bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className={`transition-colors duration-200 ${activePanel === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {activePanel === item.id && <ChevronRight className="h-3.5 w-3.5 text-primary/40" />}
              </button>
            ))}
          </nav>

          <div className="h-px bg-border/30 mx-4" />

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {activePanel === "history" && <ErrorHistory onSelect={handleHistorySelect} refreshKey={historyRefreshKey} />}
            {activePanel === "chat" && <DebugChat errorContext={errorInput || undefined} />}
            {activePanel === "snippets" && <SnippetLibrary />}
            {(activePanel === "new" || activePanel === "trends") && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  20+ AI-powered analysis modes for debugging, code review, security scanning, and more.
                </p>
                <div className="space-y-1">
                  {[
                    "TypeError: Cannot read properties of undefined",
                    "SyntaxError: Unexpected token",
                    "IndentationError: unexpected indent",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setErrorInput(ex); setInputMode("error"); setActiveCategory("Analyze"); setActivePanel("new"); }}
                      className="w-full text-left text-[11px] font-mono text-muted-foreground hover:text-foreground p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border/50"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {activePanel === "trends" ? (
            <ErrorTrends refreshKey={historyRefreshKey} />
          ) : (
            <div className="max-w-3xl mx-auto p-5 sm:p-8 lg:p-10 space-y-8 w-full">
              {/* Input Card */}
              <Card className="shadow-lg shadow-primary/[0.04] border-border/30 glass rounded-2xl overflow-hidden">
                <CardHeader className="pb-5 space-y-5 px-6 pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base font-bold flex items-center gap-3 tracking-tight">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                        <Code className="h-4 w-4 text-primary" />
                      </div>
                      Input
                    </CardTitle>
                    <ImageUpload
                      onTextExtracted={(text) => {
                        setErrorInput(text); setResult(null); setInputMode("error"); setActiveCategory("Analyze");
                      }}
                    />
                  </div>

                  {/* Category tabs */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-thin -mx-1 px-1 pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          const firstInCat = inputModes.find(m => m.category === cat);
                          if (firstInCat) setInputMode(firstInCat.id);
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                          activeCategory === cat
                            ? "btn-gradient-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {categoryIcons[cat]}
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Sub-mode pills */}
                  <div className="flex gap-2 flex-wrap">
                    {modesInCategory.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setInputMode(mode.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                          inputMode === mode.id
                            ? "bg-accent text-accent-foreground border border-primary/20 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                        }`}
                      >
                        {mode.icon}
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 px-6 pb-6">
                  <Textarea
                    placeholder={currentMode?.placeholder || "Paste your input here…"}
                    className="font-mono text-[13px] min-h-[200px] bg-background/50 resize-y rounded-xl border-border/30 focus:border-primary/40 focus:shadow-md focus:shadow-primary/5 transition-all duration-300 placeholder:text-muted-foreground/50"
                    value={errorInput}
                    onChange={(e) => setErrorInput(e.target.value)}
                  />

                  {/* Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Analysis Mode */}
                      <div className="flex items-center bg-muted/30 rounded-xl p-1 border border-border/30">
                        {(["simple", "explain", "deep"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setAnalysisMode(mode)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                              analysisMode === mode
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {mode === "simple" ? "⚡ Simple" : mode === "explain" ? "📖 Explain" : "🔬 Deep"}
                          </button>
                        ))}
                      </div>
                      {/* Output Length */}
                      <div className="flex items-center bg-muted/30 rounded-xl p-1 border border-border/30">
                        {(["short", "medium", "detailed"] as const).map((len) => (
                          <button
                            key={len}
                            onClick={() => setOutputLength(len)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                              outputLength === len
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {len.charAt(0).toUpperCase() + len.slice(1)}
                          </button>
                        ))}
                      </div>
                      <LanguageSelector value={outputLang} onChange={setOutputLang} />
                    </div>

                    <div className="flex gap-2.5">
                      {errorInput && (
                        <Button variant="ghost" size="sm" onClick={handleNewError} className="text-xs rounded-xl text-muted-foreground hover:text-foreground h-10">
                          Clear
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !errorInput.trim()}
                        className="gap-2.5 h-11 px-6 font-semibold text-sm rounded-xl btn-gradient-primary text-primary-foreground disabled:opacity-40"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {loading ? "Analyzing…" : submitLabel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-2 border-border/40" />
                      <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <div className="absolute inset-2.5 h-11 w-11 rounded-full border border-primary/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">AI is analyzing your input</p>
                      <p className="text-xs text-muted-foreground mt-2">This usually takes a few seconds…</p>
                    </div>
                  </div>
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="border-border/20 bg-card/30 rounded-2xl">
                      <CardHeader className="pb-3"><Skeleton className="h-5 w-40 rounded-lg" /></CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <Skeleton className="h-4 w-4/5 rounded-lg" />
                        <Skeleton className="h-4 w-3/5 rounded-lg" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <ResultDisplay
                    result={result}
                    inputMode={inputMode}
                    isReview={isReview}
                    onShare={handleShare}
                    similarError={similarError}
                  />
                  <Card className="mt-8 border-dashed border-border/20 bg-card/20 rounded-2xl hover:bg-card/40 transition-colors duration-300">
                    <CardContent className="py-5">
                      <button
                        onClick={() => { setActivePanel("chat"); setSidebarOpen(true); }}
                        className="w-full flex items-center justify-center gap-2.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Have more questions? Open Debug Chat →
                      </button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Empty state */}
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in duration-500">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/8 border border-primary/10 shadow-xl shadow-primary/5">
                    <Terminal className="h-10 w-10 text-primary animate-pulse-glow" />
                  </div>
                  <div className="text-center space-y-3">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Ready to debug</h2>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      Paste an error message, code snippet, or log file above. Select a mode and let AI analyze it instantly.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                    {["Error Analysis", "Security Scan", "Code Review", "Performance"].map(label => (
                      <Badge key={label} variant="secondary" className="text-[11px] font-semibold rounded-lg px-3 py-1">{label}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;
