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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Resource {
  title: string;
  url: string;
  type: "stackoverflow" | "docs" | "article";
}

export interface ExplanationResult {
  language: string;
  explanation: string;
  causes: string[];
  fixes: string[];
  correctedCode: string;
  resources: Resource[];
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

export const ResultDisplay = ({ result }: { result: ExplanationResult }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.correctedCode);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Language Badge */}
      <div className="flex items-center gap-2">
        <Badge className="font-mono text-xs">
          {result.language || "Unknown Language"}
        </Badge>
      </div>

      {/* Explanation */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent-foreground" />
            Error Explanation
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
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Why This Error Happens
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

      {/* Fixes */}
      {result.fixes?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              How to Fix It
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside">
              {result.fixes.map((fix, i) => (
                <li key={i} className="text-sm text-foreground">
                  {fix}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Corrected Code */}
      {result.correctedCode && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-mono flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Generated Fixed Code
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs font-mono h-7"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied!" : "Copy Fix"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed">
              <code>{result.correctedCode}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {result.resources?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Similar Solutions & Resources
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
