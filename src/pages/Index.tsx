import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, Send, Loader2, LogOut, Terminal,
  PanelLeftClose, PanelLeft, PlusCircle, History, MessageSquare,
  FileCode, Sparkles, BarChart3, Shield, Zap, BookOpen, Database,
  Globe, Wrench, FileText, GitCompare, Bug, Gauge, Cog,
  ArrowRightLeft, GraduationCap, Layers, Rocket,
  ClipboardList, TestTubes, ListChecks, ChevronDown, SlidersHorizontal,
  ArrowRight, Menu,
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
type TraceFn = (event: string, payload?: Record<string, unknown>) => void;

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

interface ErrorSuggestion {
  label: string;
  example: string;
}

const ERROR_SUGGESTIONS: ErrorSuggestion[] = [
  {
    label: "TypeError: undefined",
    example: "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (UserList.tsx:24:18)\n    at renderWithHooks (react-dom.development.js:14985:18)\n    at mountIndeterminateComponent (react-dom.development.js:17811:13)",
  },
  {
    label: "ReferenceError",
    example: "ReferenceError: userName is not defined\n    at handleSubmit (LoginForm.tsx:42:5)\n    at HTMLButtonElement.onclick (LoginForm.tsx:78:22)",
  },
  {
    label: "SyntaxError",
    example: "SyntaxError: Unexpected token '}' \n    at /src/utils/parser.js:18:3\n    at Module._compile (node:internal/modules/cjs/loader:1126:14)",
  },
  {
    label: "Module not found",
    example: "Module not found: Error: Can't resolve 'react-router' in '/app/src/pages'\n  > 1 | import { useNavigate } from 'react-router';\n      | ^\n  Did you mean 'react-router-dom'?",
  },
  {
    label: "CORS policy error",
    example: "Access to fetch at 'https://api.example.com/users' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
  },
  {
    label: "Network Error",
    example: "Network Error\n    at XMLHttpRequest.handleError (axios/lib/adapters/xhr.js:96:14)\n    at XMLHttpRequest.dispatchEvent\n  Config: GET https://api.example.com/data — timeout: 10000ms",
  },
  {
    label: "API request failed",
    example: "Request failed with status code 401\n  URL: POST https://api.example.com/v1/orders\n  Response: { \"error\": \"Unauthorized\", \"message\": \"Invalid or expired access token\" }",
  },
  {
    label: "Build / Compilation Error",
    example: "ERROR in ./src/App.tsx:12:8\nTS2304: Cannot find name 'useStat'. Did you mean 'useState'?\n   10 | import { useState } from 'react';\n   11 |\n>  12 | const [count, useStat] = useStat(0);\n      |        ^^^^^^^",
  },
  {
    label: "Database Connection Error",
    example: "Error: connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1494:16)\n  code: 'ECONNREFUSED', errno: -111, host: '127.0.0.1', port: 5432",
  },
  {
    label: "Authentication Error",
    example: "AuthError: Invalid login credentials\n  status: 400\n  name: 'AuthApiError'\n  message: 'Invalid login credentials'\n    at handleSignIn (auth.ts:58:11)",
  },
];

const Index = () => {
  const [errorInput, setErrorInput] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [freeQueryCount, setFreeQueryCount] = useState(() => readDailyCount());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("new");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("error");
  const [mobileModePickerOpen, setMobileModePickerOpen] = useState(false);
  const [desktopModePickerOpen, setDesktopModePickerOpen] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [desktopOptionsOpen, setDesktopOptionsOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"simple" | "explain" | "deep">("explain");
  const [outputLength, setOutputLength] = useState<"short" | "medium" | "detailed">("medium");
  const [outputLang, setOutputLang] = useState("en");
  const [similarError, setSimilarError] = useState<{ errorMessage: string; timestamp: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const suppressFocusOpenRef = useRef(false);

  const trace = useCallback<TraceFn>((event, payload = {}) => {
    console.log(`[Explain My Error trace] ${event}`, payload);
  }, []);

  useEffect(() => {
    trace("Index mounted");
    return () => trace("Index unmounted");
  }, [trace]);

  useEffect(() => {
    trace("state changed", {
      activePanel,
      inputMode,
      errorInputLength: errorInput.length,
      showSuggestions,
      mobileModePickerOpen,
      desktopModePickerOpen,
      mobileOptionsOpen,
      desktopOptionsOpen,
      loading,
      hasResult: Boolean(result),
    });
  }, [
    activePanel,
    inputMode,
    errorInput.length,
    showSuggestions,
    mobileModePickerOpen,
    desktopModePickerOpen,
    mobileOptionsOpen,
    desktopOptionsOpen,
    loading,
    result,
    trace,
  ]);

  useEffect(() => {
    if (!showSuggestions) return;
    trace("suggestions outside-click effect mounted");
    const handlePointerDown = (e: PointerEvent) => {
      if (!inputAreaRef.current) return;
      const clickedInsideInputArea = inputAreaRef.current.contains(e.target as Node);
      trace("document pointerdown while suggestions open", { clickedInsideInputArea });
      if (!clickedInsideInputArea) {
        trace("closing suggestions: outside click");
        setShowSuggestions(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      trace("suggestions outside-click effect cleanup");
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [showSuggestions, trace]);

  const filteredSuggestions = (() => {
    const q = errorInput.trim().toLowerCase();
    if (!q) return ERROR_SUGGESTIONS;
    const matches = ERROR_SUGGESTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.example.toLowerCase().includes(q)
    );
    return matches.length ? matches : ERROR_SUGGESTIONS;
  })();

  const pickSuggestion = (s: ErrorSuggestion) => {
    trace("pickSuggestion executed", { label: s.label });
    setErrorInput(s.example);
    setInputMode("error");
    setResult(null);
    setShowSuggestions(false);
    suppressFocusOpenRef.current = true;
    setTimeout(() => {
      textareaRef.current?.focus();
      suppressFocusOpenRef.current = false;
    }, 0);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
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
    trace("clear/new analysis click executed");
    setErrorInput(""); setResult(null); setSimilarError(null); setActivePanel("new");
  }, [trace]);

  const handleHistorySelect = useCallback((errorMessage: string) => {
    trace("history item click executed", { errorInputLength: errorMessage.length });
    setErrorInput(errorMessage); setResult(null); setSimilarError(null);
    setActivePanel("new"); setInputMode("error");
    setMobileNavOpen(false);
  }, [trace]);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData("text");
    if (text) {
      setErrorInput((prev) => prev ? `${prev}\n${text}` : text);
    }
  };

  const renderSidebarNav = (onSelect?: (itemId: SidebarPanel) => void) => (
    <>
      <nav className="p-3 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">Workspace</p>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { trace("sidebar menu click executed", { itemId: item.id }); setActivePanel(item.id); onSelect?.(item.id); }}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 ${
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
              {ERROR_SUGGESTIONS.slice(0, 5).map((s) => (
                <button
                  key={s.label}
                  onClick={() => { trace("quick start click executed", { label: s.label }); pickSuggestion(s); setActivePanel("new"); onSelect?.("new"); }}
                  className="w-full text-left text-[11px] font-mono text-muted-foreground hover:text-foreground p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  {s.label}
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
    </>
  );

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
          <div className="flex items-center justify-between px-3 sm:px-5 h-[54px] sm:h-[58px]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile hamburger */}
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost" size="icon"
                    className="md:hidden h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4.5 w-4.5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[78vw] max-w-[300px] p-0 flex flex-col bg-card/95 backdrop-blur-xl">
                  <SheetHeader className="px-4 py-3 border-b border-border/30">
                    <SheetTitle className="flex items-center gap-2 text-[14px]">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md btn-gradient-primary">
                        <Terminal className="h-3 w-3 text-primary-foreground" />
                      </div>
                      Explain My Error
                    </SheetTitle>
                  </SheetHeader>
                  <SidebarNav onSelect={() => setMobileNavOpen(false)} />
                </SheetContent>
              </Sheet>

              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost" size="icon"
                className="hidden md:flex h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                aria-label={desktopSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {desktopSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg btn-gradient-primary shadow-glow-sm shrink-0">
                  <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="leading-tight min-w-0">
                  <h1 className="font-semibold text-[13px] sm:text-[14px] text-foreground tracking-tight truncate">Explain My Error</h1>
                  <p className="hidden sm:block text-[10px] text-muted-foreground tracking-wide">AI debugger for developers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
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
                  <Button size="sm" className="h-8 px-3 sm:px-4 text-[11px] font-semibold rounded-lg btn-gradient-primary text-primary-foreground" onClick={() => setShowAuthModal(true)}>
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ─── Desktop Sidebar ─── */}
          <aside
            className={`hidden md:flex shrink-0 border-r border-border/30 bg-card/40 flex-col transition-all duration-300 ease-out ${
              desktopSidebarOpen ? "w-60" : "w-0 overflow-hidden"
            }`}
          >
            <SidebarNav />
          </aside>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {activePanel === "trends" ? (
              <ErrorTrends refreshKey={historyRefreshKey} />
            ) : (
              <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-5 sm:py-10 pb-32 md:pb-10 space-y-6 sm:space-y-10 w-full">

                {/* ─── Hero ─── */}
                {!result && !loading && (
                  <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto pt-1 sm:pt-2">
                    <Badge variant="secondary" className="rounded-full text-[10px] font-medium px-3 py-1 bg-accent/60 text-accent-foreground border border-border/30">
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      AI-powered · 120+ languages
                    </Badge>
                    <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
                      Paste your error. Get the fix.
                    </h2>
                    <p className="text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed px-2">
                      Instant explanations, root causes, and code fixes for any error or log.
                    </p>
                  </div>
                )}

                {/* ─── Mobile: Upload screenshot button above textarea ─── */}
                <div className="md:hidden flex items-center justify-between gap-2 -mb-2">
                  <Popover open={mobileModePickerOpen} onOpenChange={(open) => { trace("mobile mode picker open change", { open }); setMobileModePickerOpen(open); }}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-foreground bg-muted/40 hover:bg-muted/60 transition-colors">
                        <span className="text-primary">{currentMode.icon}</span>
                        <span>{currentMode.label}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[88vw] max-w-[380px] p-0 rounded-xl border-border/50 shadow-xl">
                      <ModePickerContent
                        inputMode={inputMode}
                        onPick={(id) => { trace("mobile mode option click executed", { id }); setInputMode(id); setMobileModePickerOpen(false); }}
                      />
                    </PopoverContent>
                  </Popover>
                  <ImageUpload
                    onTextExtracted={(text) => {
                      setErrorInput(text); setResult(null); setInputMode("error");
                    }}
                  />
                </div>

                {/* ─── Primary Input Card ─── */}
                <Card
                  className={`border-border/40 bg-card rounded-2xl shadow-lg shadow-black/[0.03] dark:shadow-black/20 overflow-hidden transition-all ${
                    isDragging ? "ring-2 ring-primary/50 border-primary/50" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  {/* Desktop top bar: mode picker + image upload */}
                  <div className="hidden md:flex items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-muted/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <Popover open={desktopModePickerOpen} onOpenChange={(open) => { trace("desktop mode picker open change", { open }); setDesktopModePickerOpen(open); }}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors">
                            <span className="text-primary">{currentMode.icon}</span>
                            <span>{currentMode.label}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[440px] p-0 rounded-xl border-border/50 shadow-xl">
                          <ModePickerContent
                            inputMode={inputMode}
                            onPick={(id) => { trace("desktop mode option click executed", { id }); setInputMode(id); setDesktopModePickerOpen(false); }}
                          />
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

                  {/* Textarea + Suggestions */}
                  <div ref={inputAreaRef} className="p-3 sm:p-5 pb-3 relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder={currentMode?.placeholder || "Paste your error…"}
                      className="font-mono text-[13px] min-h-[200px] sm:min-h-[240px] bg-transparent resize-y rounded-lg border-border/40 focus:border-primary/50 input-glow transition-colors placeholder:text-muted-foreground/70"
                      value={errorInput}
                      onChange={(e) => { setErrorInput(e.target.value); if (!showSuggestions) setShowSuggestions(true); }}
                      onFocus={() => { if (!suppressFocusOpenRef.current) setShowSuggestions(true); }}
                      onClick={() => setShowSuggestions(true)}
                    />

                    {showSuggestions && inputMode === "error" && (
                      <div
                        className="mt-3 rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md shadow-lg p-3 animate-in fade-in slide-in-from-top-1 duration-200 z-20"
                        role="listbox"
                        aria-label="Common error suggestions"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          textareaRef.current?.focus();
                        }}
                      >
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            {errorInput.trim() ? "Matching suggestions" : "Common errors"}
                          </span>
                          <button
                            type="button"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              setShowSuggestions(false);
                            }}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Hide suggestions"
                          >
                            Hide
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredSuggestions.map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                pickSuggestion(s);
                              }}
                              title={s.example}
                              className="text-[11.5px] font-mono text-foreground/80 hover:text-foreground bg-muted/40 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1.5 rounded-md border border-border/40 transition-all whitespace-nowrap max-w-full truncate"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Footer toolbar: options + submit (desktop) */}
                  <div className="hidden md:flex items-center justify-between gap-3 px-5 py-3 border-t border-border/30 bg-muted/10">
                    <Popover open={desktopOptionsOpen} onOpenChange={(open) => { trace("desktop options open change", { open }); setDesktopOptionsOpen(open); }}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>Options</span>
                          <span className="text-muted-foreground/70">·</span>
                          <span className="text-foreground/80 capitalize">{analysisMode}</span>
                          <span className="text-muted-foreground/70">·</span>
                          <span className="text-foreground/80 capitalize">{outputLength}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[320px] p-4 rounded-xl border-border/50 shadow-xl space-y-4">
                        <OptionsContent
                          analysisMode={analysisMode} setAnalysisMode={setAnalysisMode}
                          outputLength={outputLength} setOutputLength={setOutputLength}
                          outputLang={outputLang} setOutputLang={setOutputLang}
                        />
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

                  {/* Mobile inline analyze button (when no input yet) */}
                  {!errorInput && (
                    <div className="md:hidden p-3 pt-1 border-t border-border/30 flex items-center justify-between gap-2">
                      <Popover open={mobileOptionsOpen} onOpenChange={(open) => { trace("mobile options open change", { open }); setMobileOptionsOpen(open); }}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Options
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[88vw] max-w-[320px] p-4 rounded-xl border-border/50 shadow-xl space-y-4">
                          <OptionsContent
                            analysisMode={analysisMode} setAnalysisMode={setAnalysisMode}
                            outputLength={outputLength} setOutputLength={setOutputLength}
                            outputLang={outputLang} setOutputLang={setOutputLang}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !errorInput.trim()}
                        className="flex-1 gap-2 h-11 px-5 font-semibold text-[13px] rounded-lg btn-gradient-primary text-primary-foreground disabled:opacity-30"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {loading ? "Analyzing…" : submitLabel}
                      </Button>
                    </div>
                  )}
                </Card>

                {/* ─── Workflow hint ─── */}
                {!result && !loading && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto">
                    {[
                      { n: "1", title: "Paste", desc: "Drop in your error or code" },
                      { n: "2", title: "Analyze", desc: "AI scans in seconds" },
                      { n: "3", title: "Resolve", desc: "Get the fix and explanation" },
                    ].map((step, i, arr) => (
                      <div key={step.n} className="relative flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl bg-card/40 border border-border/30">
                        <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground text-[10px] sm:text-[11px] font-semibold">
                          {step.n}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-[12px] font-semibold text-foreground leading-tight">{step.title}</p>
                          <p className="hidden sm:block text-[10.5px] text-muted-foreground leading-tight mt-0.5">{step.desc}</p>
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
                    <div className="flex flex-col items-center justify-center py-10 sm:py-16 space-y-6">
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
                          onClick={() => { setActivePanel("chat"); setMobileNavOpen(true); }}
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

        {/* ─── Mobile Sticky Analyze Bar ─── */}
        {errorInput && !result && !loading && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 py-2.5 border-t border-border/40 glass">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleNewError} className="text-[11px] rounded-lg text-muted-foreground hover:text-foreground h-11 px-3 shrink-0">
                Clear
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 gap-2 h-11 font-semibold text-[13.5px] rounded-lg btn-gradient-primary text-primary-foreground disabled:opacity-30 shadow-glow"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {loading ? "Analyzing…" : submitLabel}
              </Button>
            </div>
          </div>
        )}

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

const ModePickerContent = ({ inputMode, onPick }: { inputMode: string; onPick: (id: string) => void }) => (
  <>
    <div className="p-3 border-b border-border/40">
      <p className="text-[11px] font-semibold text-foreground">Choose an analysis mode</p>
      <p className="text-[10px] text-muted-foreground">Pick the type of input you're pasting</p>
    </div>
    <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto scrollbar-thin p-2">
      {categories.map((cat) => {
        const modes = inputModes.filter(m => m.category === cat);
        return (
          <div key={cat} className="mb-2 last:mb-0">
            <p className="px-2 py-1.5 text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/80">{cat}</p>
            <div className="grid grid-cols-2 gap-1">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onPick(m.id)}
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
  </>
);

const OptionsContent = ({
  analysisMode, setAnalysisMode, outputLength, setOutputLength, outputLang, setOutputLang,
}: {
  analysisMode: "simple" | "explain" | "deep";
  setAnalysisMode: (m: "simple" | "explain" | "deep") => void;
  outputLength: "short" | "medium" | "detailed";
  setOutputLength: (l: "short" | "medium" | "detailed") => void;
  outputLang: string;
  setOutputLang: (l: string) => void;
}) => (
  <>
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
  </>
);

export default Index;
