import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { canQuery, recordQuery, getRemainingQueries } from "@/lib/rateLimit";
import { AlertTriangle, Zap, Code, Lightbulb, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExplanationResult {
  explanation: string;
  causes: string[];
  fixes: string[];
  correctedCode: string;
}

const Index = () => {
  const [errorInput, setErrorInput] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(getRemainingQueries());

  const handleSubmit = async () => {
    if (!errorInput.trim()) {
      toast.error("Please paste an error message first.");
      return;
    }
    if (!canQuery()) {
      toast.error("You've used all 5 free queries for today. Come back tomorrow!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("explain-error", {
        body: { errorMessage: errorInput.trim() },
      });

      if (error) throw error;

      recordQuery();
      setRemaining(getRemainingQueries());
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
          <Badge variant="outline" className="font-mono text-xs">
            {remaining}/5 queries left today
          </Badge>
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
            {/* Explanation */}
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

            {/* Causes */}
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

            {/* Fixes */}
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

            {/* Corrected Code */}
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
    </div>
  );
};

export default Index;
