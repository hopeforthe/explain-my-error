import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, History } from "lucide-react";
import {
  getErrorHistory,
  deleteErrorHistory,
  clearErrorHistory,
  type ErrorHistoryItem,
} from "@/lib/errorHistory";

interface ErrorHistoryProps {
  onSelect: (errorMessage: string) => void;
  refreshKey: number;
}

export const ErrorHistory = ({ onSelect, refreshKey }: ErrorHistoryProps) => {
  const [items, setItems] = useState<ErrorHistoryItem[]>([]);

  useEffect(() => {
    setItems(getErrorHistory());
  }, [refreshKey]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteErrorHistory(id);
    setItems(getErrorHistory());
  };

  const handleClear = () => {
    clearErrorHistory();
    setItems([]);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-medium text-foreground">Error History</span>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground h-7">
            Clear all
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground font-mono mt-2">No errors analyzed yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.errorMessage)}
                className="w-full text-left rounded-md p-2.5 hover:bg-accent/50 transition-colors group border border-transparent hover:border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-xs text-foreground line-clamp-2 flex-1">
                    {item.errorMessage.slice(0, 120)}
                  </p>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                    {item.language}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
