import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Code, Send, Loader2, LogOut, Terminal } from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResultDisplay, type ExplanationResult } from "@/components/ResultDisplay";
import type { Session } from "@supabase/supabase-js";

const FREE_QUERY_KEY = "eme_free_query_used";

const Index = () => {
  const [errorInput, setErrorInput] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [freeQueryUsed, setFreeQueryUsed] = useState(
    () => localStorage.getItem(FREE_QUERY_KEY) === "true"
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!errorInput.trim()) {
      toast.error("Please paste an error message first.");
      return;
    }

    if (!session && freeQueryUsed) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("explain-error", {
        body: { errorMessage: errorInput.trim() },
      });

      if (error) throw error;

      if (!session) {
        localStorage.setItem(FREE_QUERY_KEY, "true");
        setFreeQueryUsed(true);
      }

      setResult(data as ExplanationResult);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Terminal className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-mono text-lg font-bold text-foreground sm:text-xl">
              Explain My Error
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <>
                <Badge variant="outline" className="hidden font-mono text-xs sm:inline-flex">
                  Unlimited queries
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => supabase.auth.signOut()}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Badge
                variant="outline"
                className="cursor-pointer font-mono text-xs"
                onClick={() => setShowAuthModal(true)}
              >
                {freeQueryUsed ? "Sign in for more" : "1 free query"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Hero tagline */}
        <div className="text-center space-y-1">
          <p className="text-muted-foreground text-sm font-mono">
            Paste any error → get a plain-English explanation with fixes
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-mono flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Paste your error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`e.g. TypeError: Cannot read properties of undefined (reading 'map')\n    at App.js:12:15`}
              className="font-mono text-sm min-h-[140px] bg-background resize-y"
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !errorInput.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? "Analyzing..." : "Explain This Error"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && <ResultDisplay result={result} />}

        {/* Empty state */}
        {!result && !loading && (
          <Alert className="border-dashed">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-center text-muted-foreground py-4">
              Supports JavaScript, Python, Java, TypeScript, C++, Go, Rust, and more.
            </AlertDescription>
          </Alert>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          Explain My Error — Developer tool powered by AI
        </p>
      </footer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;
