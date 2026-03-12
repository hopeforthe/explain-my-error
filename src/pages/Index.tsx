import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  Code,
  Send,
  Loader2,
  LogOut,
  Terminal,
  PanelLeftClose,
  PanelLeft,
  PlusCircle,
  History,
  MessageSquare,
  FileCode,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResultDisplay, type ExplanationResult } from "@/components/ResultDisplay";
import { ImageUpload } from "@/components/ImageUpload";
import { DebugChat } from "@/components/DebugChat";
import { ErrorHistory } from "@/components/ErrorHistory";
import { ErrorTrends } from "@/components/ErrorTrends";
import { addErrorHistory, findSimilarError } from "@/lib/errorHistory";
import type { Session } from "@supabase/supabase-js";

const FREE_QUERY_KEY = "eme_free_query_used";

type SidebarPanel = "new" | "history" | "chat" | "trends";
type InputMode = "error" | "code" | "terminal" | "review";

const inputModes: { id: InputMode; label: string; icon: React.ReactNode; placeholder: string }[] = [
  {
    id: "error",
    label: "Error",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    placeholder: `Paste your error message or stack trace here…\n\ne.g. TypeError: Cannot read properties of undefined (reading 'map')\n    at App.js:12:15`,
  },
  {
    id: "code",
    label: "Code",
    icon: <FileCode className="h-3.5 w-3.5" />,
    placeholder: `Paste your source code here to detect bugs…\n\nfunction fetchData() {\n  const data = fetch('/api/data');\n  return data.json();\n}`,
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: <Terminal className="h-3.5 w-3.5" />,
    placeholder: `Paste your full terminal output here…\n\nThe AI will extract the main error and ignore noise.`,
  },
  {
    id: "review",
    label: "Improve",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    placeholder: `Paste code to get improvement suggestions…\n\nGet code quality, performance, and best practice recommendations.`,
  },
];

const Index = () => {
  const [errorInput, setErrorInput] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [freeQueryUsed, setFreeQueryUsed] = useState(
    () => localStorage.getItem(FREE_QUERY_KEY) === "true"
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("new");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("error");
  const [expertMode, setExpertMode] = useState(false);
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
    if (!errorInput.trim()) {
      toast.error("Please paste some input first.");
      return;
    }
    if (!session && freeQueryUsed) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setSimilarError(null);

    // Check for similar error
    const similar = findSimilarError(errorInput.trim());
    if (similar) {
      setSimilarError({ errorMessage: similar.errorMessage, timestamp: similar.timestamp });
    }

    try {
      const { data, error } = await supabase.functions.invoke("explain-error", {
        body: {
          errorMessage: errorInput.trim(),
          inputMode,
          explanationMode: expertMode ? "expert" : "beginner",
        },
      });
      if (error) throw error;

      if (!session) {
        localStorage.setItem(FREE_QUERY_KEY, "true");
        setFreeQueryUsed(true);
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
    setErrorInput("");
    setResult(null);
    setSimilarError(null);
    setActivePanel("new");
  }, []);

  const handleHistorySelect = useCallback((errorMessage: string) => {
    setErrorInput(errorMessage);
    setResult(null);
    setSimilarError(null);
    setActivePanel("new");
    setInputMode("error");
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const currentMode = inputModes.find((m) => m.id === inputMode)!;
  const submitLabel = {
    error: "Explain Error",
    code: "Analyze Code",
    terminal: "Clean & Explain",
    review: "Review Code",
  }[inputMode];

  const sidebarItems: { id: SidebarPanel; label: string; icon: React.ReactNode }[] = [
    { id: "new", label: "New Analysis", icon: <PlusCircle className="h-4 w-4" /> },
    { id: "history", label: "History", icon: <History className="h-4 w-4" /> },
    { id: "chat", label: "Debug Chat", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "trends", label: "Trends", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const showMainContent = activePanel !== "trends";

  return (
    <div className="h-screen flex flex-col bg-background transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <h1 className="font-mono text-sm font-bold text-foreground hidden sm:block">
                Explain My Error
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {session ? (
              <>
                <Badge variant="outline" className="hidden font-mono text-[10px] sm:inline-flex">
                  Unlimited
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => supabase.auth.signOut()} title="Sign out">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <Badge variant="outline" className="cursor-pointer font-mono text-[10px]" onClick={() => setShowAuthModal(true)}>
                {freeQueryUsed ? "Sign in" : "1 free query"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`shrink-0 border-r border-border bg-card flex flex-col transition-all duration-200 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
          <nav className="p-2 space-y-0.5 border-b border-border">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-mono transition-colors ${
                  activePanel === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-hidden">
            {activePanel === "history" && (
              <ErrorHistory onSelect={handleHistorySelect} refreshKey={historyRefreshKey} />
            )}
            {activePanel === "chat" && (
              <DebugChat errorContext={errorInput || undefined} />
            )}
            {(activePanel === "new" || activePanel === "trends") && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-mono">
                  Paste an error, code, terminal output, or request a code review.
                </p>
                <div className="space-y-2">
                  {["TypeError: Cannot read properties of undefined", "SyntaxError: Unexpected token", "IndentationError: unexpected indent"].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setErrorInput(ex); setInputMode("error"); setActivePanel("new"); }}
                      className="w-full text-left text-xs font-mono text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {activePanel === "trends" ? (
            <ErrorTrends refreshKey={historyRefreshKey} />
          ) : (
            <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
              {/* Input Section */}
              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base font-mono flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      Input
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <ImageUpload
                        onTextExtracted={(text) => {
                          setErrorInput(text);
                          setResult(null);
                          setInputMode("error");
                        }}
                      />
                    </div>
                  </div>

                  {/* Input mode tabs */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {inputModes.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setInputMode(mode.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                          inputMode === mode.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        {mode.icon}
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder={currentMode.placeholder}
                    className="font-mono text-xs min-h-[140px] bg-background resize-y border-border/60"
                    value={errorInput}
                    onChange={(e) => setErrorInput(e.target.value)}
                  />

                  {/* Controls row */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="expert-mode"
                        checked={expertMode}
                        onCheckedChange={setExpertMode}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label htmlFor="expert-mode" className="text-xs font-mono text-muted-foreground cursor-pointer">
                        {expertMode ? "Expert" : "Beginner"}
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      {errorInput && (
                        <Button variant="outline" onClick={handleNewError} className="font-mono text-sm">
                          Clear
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !errorInput.trim()}
                        className="gap-2 font-mono"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {loading ? "Analyzing…" : submitLabel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-border" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {inputMode === "review" ? "Reviewing your code…" : "AI is analyzing…"}
                  </p>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <>
                  <ResultDisplay
                    result={result}
                    isReview={inputMode === "review"}
                    onShare={handleShare}
                    similarError={similarError}
                  />
                  {inputMode !== "review" && (
                    <Card className="border-dashed border-border/60">
                      <CardContent className="py-4">
                        <button
                          onClick={() => { setActivePanel("chat"); setSidebarOpen(true); }}
                          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Have more questions? Open Debug Chat →
                        </button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Empty state */}
              {!result && !loading && (
                <Alert className="border-dashed border-border/60">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-center text-muted-foreground py-3 text-sm font-mono">
                    Supports errors, code analysis, terminal logs, and code reviews.
                    <br />
                    <span className="text-xs opacity-70">
                      Toggle between modes above. Upload a screenshot or paste text.
                    </span>
                  </AlertDescription>
                </Alert>
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
