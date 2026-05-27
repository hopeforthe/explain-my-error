import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://explain-my-error.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/reset-password", changefreq: "monthly", priority: "0.5" },
];

async function fetchSharedDebugs(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("Supabase env vars missing — skipping dynamic /debug/:id entries");
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("shared_debugs")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) {
      console.warn(`Failed to fetch shared_debugs: ${error.message}`);
      return [];
    }
    return (data || []).map((row: { id: string; created_at: string }) => ({
      path: `/debug/${row.id}`,
      lastmod: row.created_at?.split("T")[0],
      changefreq: "monthly" as const,
      priority: "0.6",
    }));
  } catch (e) {
    console.warn(`Error fetching shared_debugs: ${(e as Error).message}`);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const dynamicEntries = await fetchSharedDebugs();
const entries = [...staticEntries, ...dynamicEntries];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
