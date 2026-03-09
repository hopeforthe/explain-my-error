import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Zap, Code, Lightbulb, Send, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import type { Session } from "@supabase/supabase-js";

interface ExplanationResult {
  explanation: string;
  causes: string[];
  fixes: string[];
  correctedCode: string;
}

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    // If not logged in and already used free query, show auth modal
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

      // Mark free query as used if not logged in
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <h1 className="font-mono text-xl font-bold text-foreground">
              Explain My Error
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Badge variant="outline" className="font-mono text-xs">
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
                className="font-mono text-xs cursor-pointer"
                onClick={() => setShowAuthModal(true)}
              >
                {freeQueryUsed ? "Sign in for more" : "1 free query"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-mono flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Paste your error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`e.g. TypeError: Cannot read properties of undefined (reading 'map')\n    at App.js:12:15`}
              className="font-mono text-sm min-h-[120px] bg-background"
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !errorInput.trim()}
              className="w-full gap-2"
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
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-mono flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-accent-foreground" />
                  What does this mean?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{result.explanation}</p>
              </CardContent>
            </Card>

            {result.causes?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Common Causes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.causes.map((cause, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {cause}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.fixes?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Possible Fixes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.fixes.map((fix, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {fix}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.correctedCode && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Example Fix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-sm text-foreground">
                    <code>{result.correctedCode}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <Alert className="border-dashed">
            <AlertDescription className="text-center text-muted-foreground py-4">
              Paste any programming error above and get a plain-English explanation with fixes.
            </AlertDescription>
          </Alert>
        )}
      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;
