import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Zap,
  Code,
  Lightbulb,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Wand2,
  Share2,
  Shield,
  Layers,
  Star,
  CheckCircle2,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Resource {
  title: string;
  url: string;
  type: "stackoverflow" | "docs" | "article";
}

interface FixOption {
  title: string;
  description: string;
  code?: string;
}

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
  // Code review fields
  qualitySuggestions?: string[];
  performanceImprovements?: string[];
  bestPractices?: string[];
  improvedCode?: string;
  summary?: string;
}

const resourceIcon = (type: string) => {
  switch (type) {
    case "stackoverflow":
      return <Globe className="h-4 w-4 text-primary shrink-0" />;
    case "docs":
      return <Code className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <ExternalLink className="h-4 w-4 text-primary shrink-0" />;
  }
};

const difficultyColor = (d?: string) => {
  switch (d) {
    case "Easy": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "Medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "Advanced": return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";
    default: return "";
  }
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs font-mono h-7">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

function CodeBlock({ code, title, icon }: { code: string; title: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CopyButton text={code} label="Copy Fix" />
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

export const ResultDisplay = ({
  result,
  isReview = false,
  onShare,
}: {
  result: ExplanationResult;
  isReview?: boolean;
  onShare?: () => void;
}) => {
  const hasStructuredFixes = result.fixes?.length > 0 && typeof result.fixes[0] === "object" && "title" in (result.fixes[0] as any);

  // Code review mode
  if (isReview) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="font-mono text-xs">{result.language || "Unknown"}</Badge>
          {result.framework && result.framework !== "None" && (
            <Badge variant="outline" className="font-mono text-xs gap-1">
              <Layers className="h-3 w-3" /> {result.framework}
            </Badge>
          )}
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare} className="ml-auto gap-1.5 text-xs font-mono h-7">
              <Share2 className="h-3 w-3" /> Share
            </Button>
          )}
        </div>

        {result.summary && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent-foreground" /> Review Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>
        )}

        {result.qualitySuggestions && result.qualitySuggestions.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Code Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.qualitySuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.performanceImprovements && result.performanceImprovements.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.performanceImprovements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-foreground" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.bestPractices && result.bestPractices.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.bestPractices.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.improvedCode && (
          <CodeBlock code={result.improvedCode} title="Improved Code" icon={<Wand2 className="h-4 w-4 text-primary" />} />
        )}
      </div>
    );
  }

  // Error/Code/Terminal analysis mode
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="font-mono text-xs">{result.language || "Unknown Language"}</Badge>
        {result.framework && result.framework !== "None" && (
          <Badge variant="outline" className="font-mono text-xs gap-1">
            <Layers className="h-3 w-3" /> {result.framework}
          </Badge>
        )}
        {result.difficulty && (
          <Badge variant="outline" className={`font-mono text-xs gap-1 ${difficultyColor(result.difficulty)}`}>
            <Shield className="h-3 w-3" /> {result.difficulty}
          </Badge>
        )}
        {onShare && (
          <Button variant="ghost" size="sm" onClick={onShare} className="ml-auto gap-1.5 text-xs font-mono h-7">
            <Share2 className="h-3 w-3" /> Share
          </Button>
        )}
      </div>

      {result.difficultyExplanation && (
        <p className="text-xs text-muted-foreground font-mono px-1">{result.difficultyExplanation}</p>
      )}

      {/* Extracted error from terminal */}
      {result.extractedError && (
        <Card className="border-border/60 border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Extracted Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground">
              {result.extractedError}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent-foreground" /> Error Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{result.explanation}</p>
        </CardContent>
      </Card>

      {/* Causes */}
      {result.causes?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Why This Error Happens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.causes.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {cause}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Multiple Fix Suggestions */}
      {result.fixes?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Possible Fixes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasStructuredFixes
              ? (result.fixes as FixOption[]).map((fix, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">
                        Fix {i + 1}
                      </Badge>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{fix.title}</p>
                        <p className="text-sm text-muted-foreground">{fix.description}</p>
                      </div>
                    </div>
                    {fix.code && (
                      <div className="ml-12">
                        <div className="flex justify-end mb-1">
                          <CopyButton text={fix.code} label="Copy" />
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-background border border-border p-3 font-mono text-xs text-foreground leading-relaxed">
                          <code>{fix.code}</code>
                        </pre>
                      </div>
                    )}
                    {i < (result.fixes as FixOption[]).length - 1 && (
                      <div className="border-t border-border/40 pt-2" />
                    )}
                  </div>
                ))
              : (result.fixes as string[]).map((fix, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5">
                      {i + 1}
                    </Badge>
                    {fix}
                  </div>
                ))}
          </CardContent>
        </Card>
      )}

      {/* Corrected Code / Auto Fix */}
      {result.correctedCode && (
        <CodeBlock
          code={result.correctedCode}
          title="Auto-Fixed Code"
          icon={<Wand2 className="h-4 w-4 text-primary" />}
        />
      )}

      {/* Problem Lines */}
      {result.problemLines && result.problemLines.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Star className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">
            Issues detected on line{result.problemLines.length > 1 ? "s" : ""}: {result.problemLines.join(", ")}
          </span>
        </div>
      )}

      {/* Resources */}
      {result.resources?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Similar Solutions & Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.resources.map((res, i) => (
                <li key={i}>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline transition-colors"
                  >
                    {resourceIcon(res.type)}
                    <span className="text-sm">{res.title}</span>
                    <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                  </a>
                  <span className="text-xs text-muted-foreground ml-6 capitalize">
                    {res.type === "stackoverflow" ? "Stack Overflow" : res.type}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
