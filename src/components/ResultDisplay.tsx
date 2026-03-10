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
      return <Globe className="h-4 w-4 text-primary" />;
    case "docs":
      return <Code className="h-4 w-4 text-primary" />;
    default:
      return <ExternalLink className="h-4 w-4 text-primary" />;
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
              Why This Error Happens
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
              How to Fix It
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside">
              {result.fixes.map((fix, i) => (
                <li key={i} className="text-foreground">
                  {fix}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Corrected Code */}
      {result.correctedCode && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-mono flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Correct Code Example
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy Fix"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-background border border-border p-4 font-mono text-sm text-foreground">
              <code>{result.correctedCode}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {result.resources?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-mono flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
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
                    <ExternalLink className="h-3 w-3 opacity-50" />
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
