import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResultDisplay, type ExplanationResult } from "@/components/ResultDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Terminal, ArrowLeft, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";

interface DebugComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const SharedDebug = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ input_text: string; input_mode: string; result: ExplanationResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<DebugComment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [debugRes, commentsRes] = await Promise.all([
          supabase.functions.invoke("get-shared-debug", { body: { id } }),
          supabase.functions.invoke("get-debug-comments", { body: { debugId: id } }),
        ]);
        if (debugRes.error) throw debugRes.error;
        setData(debugRes.data);
        setComments(commentsRes.data || []);
      } catch (e: any) {
        setError(e?.message || "Debug not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;
    setSubmitting(true);
    try {
      const { data: newComment, error } = await supabase.functions.invoke("add-debug-comment", {
        body: { debugId: id, authorName: commentName.trim() || "Anonymous", content: commentText.trim() },
      });
      if (error) throw error;
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      toast.success("Comment added!");
    } catch (err: any) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{data ? `Shared Debug — ${data.input_mode.charAt(0).toUpperCase() + data.input_mode.slice(1)} Result` : "Shared Debug Result — Explain My Error"}</title>
        <meta name="description" content="View a shared AI-powered debug analysis, explanation, and fix. Collaborate with comments." />
        <link rel="canonical" href={`https://explain-my-error.lovable.app/debug/${id}`} />
        <meta property="og:title" content="Shared Debug Result — Explain My Error" />
        <meta property="og:description" content="View a shared AI-powered debug analysis, explanation, and fix." />
        <meta property="og:url" content={`https://explain-my-error.lovable.app/debug/${id}`} />
      </Helmet>
      <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <h1 className="font-mono text-sm font-bold text-foreground">Shared Debug Results — Explain My Error</h1>
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

            {/* Team Collaboration / Comments */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-mono flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Discussion
                  <Badge variant="outline" className="font-mono text-[10px]">{comments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground font-mono text-center py-2">
                    No comments yet. Be the first to discuss this debug!
                  </p>
                )}

                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/30">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-foreground">{c.author_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-4 space-y-2">
                  <Input
                    placeholder="Your name (optional)"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="font-mono text-xs h-8"
                    aria-label="Your name (optional)"
                  />
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment or suggestion…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="font-mono text-xs min-h-[60px] flex-1"
                      aria-label="Comment"
                    />
                    <Button
                      size="icon"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submitting}
                      className="shrink-0 h-auto"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default SharedDebug;
