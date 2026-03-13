import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Snippet {
  id: string;
  title: string;
  category: string;
  language: string;
  code: string;
  description: string;
}

const snippets: Snippet[] = [
  { id: "1", title: "Async/Await Error Handling", category: "JavaScript", language: "JavaScript", description: "Proper try/catch with async functions", code: `async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);\n    return await response.json();\n  } catch (error) {\n    console.error('Fetch failed:', error);\n    throw error;\n  }\n}` },
  { id: "2", title: "Null Safe Access", category: "JavaScript", language: "TypeScript", description: "Optional chaining and nullish coalescing", code: `const userName = user?.profile?.name ?? 'Anonymous';\nconst items = data?.results?.map(r => r.value) ?? [];` },
  { id: "3", title: "React useEffect Cleanup", category: "React", language: "TypeScript", description: "Prevent memory leaks with cleanup", code: `useEffect(() => {\n  const controller = new AbortController();\n  fetchData(url, { signal: controller.signal })\n    .then(setData)\n    .catch(err => {\n      if (err.name !== 'AbortError') setError(err);\n    });\n  return () => controller.abort();\n}, [url]);` },
  { id: "4", title: "Python Try/Except Pattern", category: "Python", language: "Python", description: "Proper exception handling in Python", code: `try:\n    result = process_data(input_data)\nexcept ValueError as e:\n    logger.error(f"Invalid data: {e}")\n    raise\nexcept Exception as e:\n    logger.exception("Unexpected error")\n    return None` },
  { id: "5", title: "SQL Parameterized Query", category: "Database", language: "SQL", description: "Prevent SQL injection", code: "-- Bad: string concatenation\n-- SELECT * FROM users WHERE id = '<user_id>'\n\n-- Good: parameterized\nSELECT * FROM users WHERE id = $1;\n\n-- Node.js example:\nconst result = await pool.query(\n  'SELECT * FROM users WHERE id = $1',\n  [userId]\n);" },
  { id: "6", title: "API Rate Limit Handler", category: "API", language: "TypeScript", description: "Retry with exponential backoff", code: `async function fetchWithRetry(url: string, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    const res = await fetch(url);\n    if (res.status === 429) {\n      const delay = Math.pow(2, i) * 1000;\n      await new Promise(r => setTimeout(r, delay));\n      continue;\n    }\n    return res;\n  }\n  throw new Error('Max retries exceeded');\n}` },
  { id: "7", title: "React Error Boundary", category: "React", language: "TypeScript", description: "Catch rendering errors gracefully", code: `class ErrorBoundary extends React.Component {\n  state = { hasError: false };\n  static getDerivedStateFromError() {\n    return { hasError: true };\n  }\n  componentDidCatch(error, info) {\n    console.error('Error boundary:', error, info);\n  }\n  render() {\n    if (this.state.hasError) {\n      return <h2>Something went wrong.</h2>;\n    }\n    return this.props.children;\n  }\n}` },
  { id: "8", title: "Docker Container Debug", category: "DevOps", language: "Bash", description: "Common Docker debugging commands", code: `# View logs\ndocker logs <container_id> --tail 100 -f\n\n# Shell into container\ndocker exec -it <container_id> /bin/sh\n\n# Check resource usage\ndocker stats <container_id>\n\n# Inspect container\ndocker inspect <container_id>` },
  { id: "9", title: "Git Undo Changes", category: "DevOps", language: "Bash", description: "Common git recovery commands", code: `# Undo last commit (keep changes)\ngit reset --soft HEAD~1\n\n# Discard all local changes\ngit checkout -- .\n\n# Recover deleted branch\ngit reflog\ngit checkout -b recovered <commit_hash>\n\n# Undo pushed commit\ngit revert <commit_hash>` },
  { id: "10", title: "Express Error Middleware", category: "Node.js", language: "TypeScript", description: "Centralized error handling for Express", code: `app.use((err, req, res, next) => {\n  console.error(err.stack);\n  const status = err.statusCode || 500;\n  res.status(status).json({\n    error: {\n      message: err.message,\n      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })\n    }\n  });\n});` },
  { id: "11", title: "Python Virtual Environment", category: "Python", language: "Bash", description: "Fix Python dependency issues", code: `# Create virtual environment\npython -m venv venv\n\n# Activate (Linux/Mac)\nsource venv/bin/activate\n\n# Activate (Windows)\nvenv\\Scripts\\activate\n\n# Install dependencies\npip install -r requirements.txt\n\n# Freeze current deps\npip freeze > requirements.txt` },
  { id: "12", title: "CORS Fix Express", category: "API", language: "TypeScript", description: "Fix CORS errors in Express", code: `import cors from 'cors';\n\napp.use(cors({\n  origin: ['http://localhost:3000', 'https://myapp.com'],\n  methods: ['GET', 'POST', 'PUT', 'DELETE'],\n  credentials: true,\n}));` },
];

const categories = ["All", ...new Set(snippets.map(s => s.category))];

function SnippetCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success("Copied!");
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded hover:bg-accent/50 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

export const SnippetLibrary = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = snippets.filter(s => {
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || s.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="font-mono text-sm font-medium text-foreground">Snippets</span>
      </div>

      <div className="p-3 space-y-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets…"
            className="pl-7 h-7 text-xs font-mono bg-background"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="rounded-md border border-border p-2.5 space-y-1.5 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-1">
              <div>
                <p className="text-xs font-mono font-medium text-foreground leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.description}</p>
              </div>
              <SnippetCopyButton code={s.code} />
            </div>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[9px] font-mono h-4 px-1">{s.language}</Badge>
            </div>
            <pre className="overflow-x-auto rounded bg-background border border-border p-2 font-mono text-[10px] text-foreground leading-relaxed max-h-24">
              <code>{s.code}</code>
            </pre>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 font-mono">No snippets found</p>
        )}
      </div>
    </div>
  );
};
