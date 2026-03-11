import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResultDisplay, type ExplanationResult } from "@/components/ResultDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Terminal, ArrowLeft } from "lucide-react";

const SharedDebug = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ input_text: string; input_mode: string; result: ExplanationResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: res, error: err } = await supabase.functions.invoke("get-shared-debug", {
          body: { id },
        });
        if (err) throw err;
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Debug not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <h1 className="font-mono text-sm font-bold text-foreground">Explain My Error</h1>
            <Badge variant="outline" className="font-mono text-[10px]">Shared</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <ArrowLeft className="h-3 w-3" /> Try it
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono">Loading shared debug…</p>
          </div>
        )}

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-destructive font-mono">{error}</p>
              <Link to="/">
                <Button variant="outline" className="mt-4 font-mono">Go to Explain My Error</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-mono">
                  Original {data.input_mode === "review" ? "Code" : data.input_mode === "terminal" ? "Terminal Output" : data.input_mode === "code" ? "Source Code" : "Error"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed max-h-60 overflow-y-auto">
                  {data.input_text}
                </pre>
              </CardContent>
            </Card>

            <ResultDisplay result={data.result} isReview={data.input_mode === "review"} />
          </>
        )}
      </main>
    </div>
  );
};

export default SharedDebug;
