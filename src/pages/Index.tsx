import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, Send, Loader2, LogOut, Terminal,
  PanelLeftClose, PanelLeft, PlusCircle, History, MessageSquare,
  FileCode, Sparkles, BarChart3, Shield, Zap, BookOpen, Database,
  Globe, Wrench, FileText, GitCompare, Bug, Gauge, Cog,
  ArrowRightLeft, GraduationCap, Layers, Rocket,
  ClipboardList, TestTubes, ListChecks, ChevronDown, SlidersHorizontal,
  ArrowRight, Command,
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
import { UpgradePrompt } from "@/components/UpgradePrompt";
import type { Session } from "@supabase/supabase-js";

const FREE_QUERY_KEY = "eme_free_query_count";
const FREE_QUERY_DATE_KEY = "eme_free_query_date";
const MAX_FREE_QUERIES = 10;

const todayKey = () => new Date().toISOString().slice(0, 10);
const readDailyCount = () => {
  const storedDate = localStorage.getItem(FREE_QUERY_DATE_KEY);
  if (storedDate !== todayKey()) {
    localStorage.setItem(FREE_QUERY_DATE_KEY, todayKey());
    localStorage.setItem(FREE_QUERY_KEY, "0");
    return 0;
  }
  const stored = localStorage.getItem(FREE_QUERY_KEY);
  return stored ? parseInt(stored, 10) : 0;
};

type SidebarPanel = "new" | "history" | "chat" | "trends" | "snippets";
type InputMode = string;

interface ModeConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  category: string;
  description?: string;
}

const inputModes: ModeConfig[] = [
  { id: "error", label: "Error", icon: <AlertTriangle className="h-3.5 w-3.5" />, category: "Analyze", description: "Explain runtime errors & stack traces",
    placeholder: "Paste your error message or stack trace here…\n\ne.g. TypeError: Cannot read properties of undefined (reading 'map')" },
  { id: "code", label: "Bug Detect", icon: <Bug className="h-3.5 w-3.5" />, category: "Analyze", description: "Find bugs in source code",
    placeholder: "Paste your source code here to detect bugs…" },
  { id: "terminal", label: "Terminal", icon: <Terminal className="h-3.5 w-3.5" />, category: "Analyze", description: "Decode terminal output",
    placeholder: "Paste your full terminal output here…" },
  { id: "api", label: "API Error", icon: <Globe className="h-3.5 w-3.5" />, category: "Analyze", description: "Debug HTTP & API errors",
    placeholder: "Paste API error responses, curl commands, or HTTP errors here…" },
  { id: "log", label: "Log File", icon: <FileText className="h-3.5 w-3.5" />, category: "Analyze", description: "Analyze log files",
    placeholder: "Paste log file contents (server.log, error.log, docker logs)…" },
  { id: "sql", label: "SQL Debug", icon: <Database className="h-3.5 w-3.5" />, category: "Analyze", description: "Debug SQL queries",
    placeholder: "Paste SQL queries or database error messages here…" },
  { id: "cicd", label: "CI/CD", icon: <Cog className="h-3.5 w-3.5" />, category: "Analyze", description: "Pipeline failure diagnosis",
    placeholder: "Paste CI/CD pipeline errors (GitHub Actions, Docker, Jenkins)…" },
  { id: "deploy", label: "Deploy", icon: <Rocket className="h-3.5 w-3.5" />, category: "Analyze", description: "Deployment errors",
    placeholder: "Paste deployment errors from Vercel, Netlify, AWS, Docker…" },
  { id: "env", label: "Environment", icon: <Wrench className="h-3.5 w-3.5" />, category: "Analyze", description: "Env / version issues",
    placeholder: "Paste environment errors (version mismatch, missing packages)…" },
  { id: "review", label: "Code Review", icon: <Sparkles className="h-3.5 w-3.5" />, category: "Improve", description: "Improvement suggestions",
    placeholder: "Paste code to get improvement suggestions…" },
  { id: "refactor", label: "Refactor", icon: <Layers className="h-3.5 w-3.5" />, category: "Improve", description: "Refactoring suggestions",
    placeholder: "Paste code to get refactoring suggestions…" },
  { id: "security", label: "Security Scan", icon: <Shield className="h-3.5 w-3.5" />, category: "Improve", description: "Vulnerability scan",
    placeholder: "Paste code to scan for security vulnerabilities…" },
  { id: "performance", label: "Performance", icon: <Zap className="h-3.5 w-3.5" />, category: "Improve", description: "Performance analysis",
    placeholder: "Paste code to analyze performance…" },
  { id: "complexity", label: "Complexity", icon: <Gauge className="h-3.5 w-3.5" />, category: "Improve", description: "Complexity metrics",
    placeholder: "Paste code to analyze its complexity metrics…" },
  { id: "explain", label: "Explain Code", icon: <BookOpen className="h-3.5 w-3.5" />, category: "Generate", description: "Line-by-line walkthrough",
    placeholder: "Paste code for a line-by-line explanation…" },
  { id: "docs", label: "Generate Docs", icon: <FileCode className="h-3.5 w-3.5" />, category: "Generate", description: "Auto-generate docs",
    placeholder: "Paste code to automatically generate documentation…" },
  { id: "reproduce", label: "Reproduce Bug", icon: <Bug className="h-3.5 w-3.5" />, category: "Generate", description: "Minimal repro example",
    placeholder: "Paste buggy code to generate a minimal reproducible example…" },
  { id: "interview", label: "Interview Prep", icon: <GraduationCap className="h-3.5 w-3.5" />, category: "Generate", description: "Interview-style questions",
    placeholder: "Paste code or error to generate interview-style questions…" },
  { id: "diff", label: "Code Diff", icon: <GitCompare className="h-3.5 w-3.5" />, category: "Compare", description: "Compare two versions",
    placeholder: "Paste two versions separated by:\n--- OLD CODE ---\n(old code)\n--- NEW CODE ---\n(new code)" },
  { id: "migrate", label: "Migrate", icon: <ArrowRightLeft className="h-3.5 w-3.5" />, category: "Compare", description: "Migrate between stacks",
    placeholder: "Paste code and specify the migration target." },
  { id: "bugreport", label: "Bug Report", icon: <ClipboardList className="h-3.5 w-3.5" />, category: "Tester Tools", description: "Generate a bug report",
    placeholder: "Paste an error message, failure log, or bug description…" },
  { id: "testcase", label: "Test Cases", icon: <TestTubes className="h-3.5 w-3.5" />, category: "Tester Tools", description: "Generate test cases",
    placeholder: "Describe a feature or module to generate test cases…" },
  { id: "testscenario", label: "Scenarios", icon: <ListChecks className="h-3.5 w-3.5" />, category: "Tester Tools", description: "Generate scenarios",
    placeholder: "Enter a feature or module name to generate test scenarios…" },
];

const categories = ["Analyze", "Improve", "Generate", "Compare", "Tester Tools"];

const Index = () => {
  const [errorInput, setErrorInput] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [freeQueryCount, setFreeQueryCount] = useState(() => readDailyCount());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(max-width: 768px)").matches;
  });
  const [activePanel, setActivePanel] = useState<SidebarPanel>("new");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("error");
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
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
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSubmit = async () => {
    if (!errorInput.trim()) { toast.error("Please paste some input first."); return; }
    if (!session && freeQueryCount >= MAX_FREE_QUERIES) { setShowUpgrade(true); return; }

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
    setActivePanel("new"); setInputMode("error");
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const currentMode = inputModes.find((m) => m.id === inputMode)!;
  const reviewModes = ["review", "refactor", "security", "performance", "complexity"];
  const isReview = reviewModes.includes(inputMode);

  const submitLabels: Record<string, string> = {
    error: "Analyze Error", code: "Analyze Code", terminal: "Clean & Explain",
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

  const exampleChips = [
    "TypeError: Cannot read properties of undefined",
    "CORS policy: No 'Access-Control-Allow-Origin'",
    "Module not found: Can't resolve",
    "SyntaxError: Unexpected token",
  ];

  return (
    <>
      <Helmet>
        <title>Explain My Error — AI Debugger for Developers</title>
        <meta name="description" content="Paste any programming error and get an instant AI-powered explanation, root cause, and fix. Debug smarter, not harder — across 120+ languages." />
        <link rel="canonical" href="https://explain-my-error.lovable.app/" />
        <meta property="og:title" content="Explain My Error — AI Debugger for Developers" />
        <meta property="og:description" content="Paste any programming error and get an instant AI-powered explanation, root cause, and fix." />
        <meta property="og:url" content="https://explain-my-error.lovable.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Explain My Error",
          "description": "AI-powered debugger for developers. Paste any programming error and get instant explanation, root cause, and fix across 120+ languages.",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "author": { "@type": "Organization", "name": "Explain My Error" },
          "url": "https://explain-my-error.lovable.app/"
        })}</script>
      </Helmet>
      <div className="h-screen flex flex-col bg-gradient-dark transition-colors duration-300 overflow-hidden">
        {/* ─── Header ─── */}
        <header className="shrink-0 z-50 border-b border-border/30 glass">
          <div className="flex items-center justify-between px-5 h-[58px]">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-gradient-primary shadow-glow-sm">
                  <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="hidden sm:block leading-tight">
                  <h1 className="font-semibold text-[14px] text-foreground tracking-tight">Explain My Error</h1>
                  <p className="text-[10px] text-muted-foreground tracking-wide">AI debugger for developers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {session ? (
                <>
                  <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-semibold border-primary/20 bg-primary/10 text-primary rounded-full px-2.5 py-0.5">Pro</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => supabase.auth.signOut()} aria-label="Sign out">
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  {remaining > 0 ? (
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-full px-3 py-1.5 border border-border/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      <span className="font-medium">{remaining}</span>
                      <span className="text-muted-foreground/70">free left</span>
                    </div>
                  ) : (
                    <button onClick={() => setShowUpgrade(true)} className="hidden sm:inline-flex">
                      <Badge variant="destructive" className="text-[10px] rounded-full cursor-pointer">Limit reached</Badge>
                    </button>
                  )}
                  <Button size="sm" className="h-8 px-4 text-[11px] font-semibold rounded-lg btn-gradient-primary text-primary-foreground" onClick={() => setShowAuthModal(true)}>
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ─── Sidebar ─── */}
          <aside
            className={`shrink-0 border-r border-border/30 bg-card/40 flex flex-col transition-all duration-300 ease-out ${
              sidebarOpen ? "w-60 max-w-[75vw]" : "w-0 overflow-hidden"
            }`}
          >
            <nav className="p-3 space-y-0.5">
              <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">Workspace</p>
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-all duration-200 ${
                    activePanel === item.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <span className={activePanel === item.id ? "text-primary" : ""}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="h-px bg-border/30 mx-3" />

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
              {activePanel === "history" && <ErrorHistory onSelect={handleHistorySelect} refreshKey={historyRefreshKey} />}
              {activePanel === "chat" && <DebugChat errorContext={errorInput || undefined} />}
              {activePanel === "snippets" && <SnippetLibrary />}
              {(activePanel === "new" || activePanel === "trends") && (
                <div className="p-4 space-y-3">
                  <p className="px-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">Quick start</p>
                  <div className="space-y-1">
                    {[
                      "TypeError: Cannot read properties of undefined",
                      "SyntaxError: Unexpected token",
                      "IndentationError: unexpected indent",
                    ].map((ex) => (
                      <button
                        key={ex}
                        onClick={() => { setErrorInput(ex); setInputMode("error"); setActivePanel("new"); }}
                        className="w-full text-left text-[11px] font-mono text-muted-foreground hover:text-foreground p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed px-1">
                20+ AI modes · 120+ languages
              </p>
            </div>
          </aside>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {activePanel === "trends" ? (
              <ErrorTrends refreshKey={historyRefreshKey} />
            ) : (
              <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10 lg:py-14 space-y-10 w-full">

                {/* ─── Hero ─── */}
                {!result && !loading && (
                  <div className="text-center space-y-3 max-w-2xl mx-auto">
                    <Badge variant="secondary" className="rounded-full text-[10px] font-medium px-3 py-1 bg-accent/60 text-accent-foreground border border-border/30">
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      AI-powered · 120+ languages
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                      Paste your error. Get the fix.
                    </h2>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">
                      Instant explanations, root causes, and code suggestions for any error, log, or snippet.
                    </p>
                  </div>
                )}

                {/* ─── Primary Input Card ─── */}
                <Card className="border-border/40 bg-card rounded-2xl shadow-lg shadow-black/[0.03] dark:shadow-black/20 overflow-hidden">
                  {/* Top bar: mode picker + image upload */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-muted/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <Popover open={modePickerOpen} onOpenChange={setModePickerOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors">
                            <span className="text-primary">{currentMode.icon}</span>
                            <span>{currentMode.label}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[440px] p-0 rounded-xl border-border/50 shadow-xl">
                          <div className="p-3 border-b border-border/40">
                            <p className="text-[11px] font-semibold text-foreground">Choose an analysis mode</p>
                            <p className="text-[10px] text-muted-foreground">Pick the type of input you're pasting</p>
                          </div>
                          <div className="max-h-[420px] overflow-y-auto scrollbar-thin p-2">
                            {categories.map((cat) => {
                              const modes = inputModes.filter(m => m.category === cat);
                              return (
                                <div key={cat} className="mb-2 last:mb-0">
                                  <p className="px-2 py-1.5 text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/80">{cat}</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {modes.map((m) => (
                                      <button
                                        key={m.id}
                                        onClick={() => { setInputMode(m.id); setModePickerOpen(false); }}
                                        className={`flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                                          inputMode === m.id ? "bg-accent" : "hover:bg-muted/50"
                                        }`}
                                      >
                                        <span className={`mt-0.5 ${inputMode === m.id ? "text-primary" : "text-muted-foreground"}`}>{m.icon}</span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11.5px] font-medium text-foreground leading-tight">{m.label}</p>
                                          {m.description && <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{m.description}</p>}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {currentMode.description && (
                        <span className="hidden md:inline text-[11px] text-muted-foreground truncate">· {currentMode.description}</span>
                      )}
                    </div>
                    <ImageUpload
                      onTextExtracted={(text) => {
                        setErrorInput(text); setResult(null); setInputMode("error");
                      }}
                    />
                  </div>

                  {/* Textarea */}
                  <div className="p-5 pb-3">
                    <Textarea
                      placeholder={currentMode?.placeholder || "Paste your error…"}
                      className="font-mono text-[13px] min-h-[220px] bg-transparent resize-y rounded-lg border-border/40 focus:border-primary/50 input-glow transition-colors placeholder:text-muted-foreground/60"
                      value={errorInput}
                      onChange={(e) => setErrorInput(e.target.value)}
                    />

                    {!errorInput && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="text-[10px] text-muted-foreground self-center mr-1 font-medium">Try</span>
                        {exampleChips.map(chip => (
                          <button
                            key={chip}
                            onClick={() => { setErrorInput(chip); setInputMode("error"); }}
                            className="text-[10px] font-mono text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 px-2.5 py-1 rounded-md border border-border/30 transition-colors"
                          >
                            {chip.length > 32 ? chip.slice(0, 32) + "…" : chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer toolbar: options + submit */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border/30 bg-muted/10">
                    <Popover open={optionsOpen} onOpenChange={setOptionsOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>Options</span>
                          <span className="hidden sm:inline text-muted-foreground/70">·</span>
                          <span className="hidden sm:inline text-foreground/80 capitalize">{analysisMode}</span>
                          <span className="hidden sm:inline text-muted-foreground/70">·</span>
                          <span className="hidden sm:inline text-foreground/80 capitalize">{outputLength}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[320px] p-4 rounded-xl border-border/50 shadow-xl space-y-4">
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">Analysis depth</p>
                          <div className="flex items-center bg-muted/40 rounded-lg p-0.5">
                            {(["simple", "explain", "deep"] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setAnalysisMode(mode)}
                                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all ${
                                  analysisMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">Output length</p>
                          <div className="flex items-center bg-muted/40 rounded-lg p-0.5">
                            {(["short", "medium", "detailed"] as const).map((len) => (
                              <button
                                key={len}
                                onClick={() => setOutputLength(len)}
                                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all ${
                                  outputLength === len ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {len}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">Output language</p>
                          <LanguageSelector value={outputLang} onChange={setOutputLang} />
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="flex items-center gap-2">
                      {errorInput && (
                        <Button variant="ghost" size="sm" onClick={handleNewError} className="text-[11px] rounded-lg text-muted-foreground hover:text-foreground h-9">
                          Clear
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !errorInput.trim()}
                        className="gap-2 h-9 px-5 font-semibold text-[12.5px] rounded-lg btn-gradient-primary text-primary-foreground disabled:opacity-30 shadow-glow"
                      >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {loading ? "Analyzing…" : submitLabel}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* ─── Workflow hint ─── */}
                {!result && !loading && (
                  <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                    {[
                      { n: "1", title: "Paste", desc: "Drop in your error or code" },
                      { n: "2", title: "Analyze", desc: "AI scans in seconds" },
                      { n: "3", title: "Resolve", desc: "Get the fix and explanation" },
                    ].map((step, i, arr) => (
                      <div key={step.n} className="relative flex items-start gap-2.5 p-3 rounded-xl bg-card/40 border border-border/30">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground text-[11px] font-semibold">
                          {step.n}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-foreground leading-tight">{step.title}</p>
                          <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{step.desc}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <ArrowRight className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-border" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col items-center justify-center py-16 space-y-6">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full border border-border/20" />
                        <div className="absolute inset-0 h-14 w-14 rounded-full border-2 border-primary/40 border-t-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-foreground/80">Analyzing your input…</p>
                        <p className="text-[11px] text-muted-foreground">This usually takes a few seconds</p>
                      </div>
                    </div>
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="border-border/30 bg-card/40 rounded-2xl">
                        <CardContent className="p-5 space-y-3">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-full rounded-md" />
                          <Skeleton className="h-3 w-4/5 rounded-md" />
                          <Skeleton className="h-3 w-3/5 rounded-md" />
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
                    <Card className="mt-8 border-dashed border-border/40 bg-card/30 rounded-2xl hover:bg-card/50 transition-colors">
                      <CardContent className="py-4">
                        <button
                          onClick={() => { setActivePanel("chat"); setSidebarOpen(true); }}
                          className="w-full flex items-center justify-center gap-2 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Have follow-up questions? Open Debug Chat
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
        <UpgradePrompt
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          limit={MAX_FREE_QUERIES}
          onSignIn={() => { setShowUpgrade(false); setShowAuthModal(true); }}
        />
      </div>
    </>
  );
};

export default Index;
