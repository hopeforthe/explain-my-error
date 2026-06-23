import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { streamChat, type ChatMsg } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface DebugChatProps {
  errorContext?: string;
  temporary?: boolean;
}

export const DebugChat = ({ errorContext, temporary = false }: DebugChatProps) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Reset chat when error context or temporary mode changes
  useEffect(() => {
    setMessages([]);
  }, [errorContext, temporary]);

  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";
    abortRef.current = new AbortController();

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        errorContext,
        onDelta: upsert,
        onDone: () => setIsStreaming(false),
        signal: abortRef.current.signal,
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
        toast.error("Chat error. Please try again.");
      }
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm font-medium text-foreground">Debug Chat</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground font-mono">
              Ask follow-up questions about your error
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["How do I fix this?", "Show me another example", "Why does this happen?"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-2.5 py-1 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors font-mono"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_code]:font-mono [&_code]:text-xs">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="font-mono">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question…"
            className="font-mono text-sm bg-background"
            disabled={isStreaming}
            aria-label="Chat message"
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()} aria-label="Send message">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};
