import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Code, Layers, TrendingUp, Hash } from "lucide-react";
import { getErrorTrends, type ErrorTrendData } from "@/lib/errorHistory";
import { useMemo } from "react";

export const ErrorTrends = ({ refreshKey }: { refreshKey: number }) => {
  const trends = useMemo<ErrorTrendData>(() => getErrorTrends(), [refreshKey]);

  if (trends.totalErrors === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground font-mono">No error data yet. Analyze some errors to see trends.</p>
      </div>
    );
  }

  const langEntries = Object.entries(trends.languageCounts).sort((a, b) => b[1] - a[1]);
  const fwEntries = Object.entries(trends.frameworkCounts).sort((a, b) => b[1] - a[1]);
  const maxLang = langEntries[0]?.[1] || 1;
  const maxFw = fwEntries[0]?.[1] || 1;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-mono font-bold text-foreground">Error Trends</h2>
        <Badge variant="outline" className="font-mono text-[10px]">{trends.totalErrors} total</Badge>
      </div>

      {/* By Language */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Errors by Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {langEntries.map(([lang, count]) => (
            <div key={lang} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-foreground">{lang}</span>
                <span className="text-xs font-mono text-muted-foreground">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(count / maxLang) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* By Framework */}
      {fwEntries.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Errors by Framework
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fwEntries.map(([fw, count]) => (
              <div key={fw} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-foreground">{fw}</span>
                  <span className="text-xs font-mono text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-foreground transition-all duration-500"
                    style={{ width: `${(count / maxFw) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Most Common Errors */}
      {trends.topErrors.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Most Common Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {trends.topErrors.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5 gap-1">
                    <Hash className="h-2.5 w-2.5" />{e.count}
                  </Badge>
                  <span className="text-xs font-mono text-foreground truncate">{e.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Daily Activity */}
      {Object.keys(trends.dailyCounts).length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Daily Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-20">
              {Object.entries(trends.dailyCounts).slice(-14).map(([day, count]) => {
                const maxDaily = Math.max(...Object.values(trends.dailyCounts));
                const height = (count / maxDaily) * 100;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all duration-500 min-h-[2px]"
                      style={{ height: `${height}%` }}
                      title={`${day}: ${count} errors`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground font-mono">
                {Object.keys(trends.dailyCounts).slice(-14)[0]}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">
                {Object.keys(trends.dailyCounts).slice(-1)[0]}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
