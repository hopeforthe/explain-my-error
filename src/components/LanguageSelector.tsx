import { useState, useRef, useEffect, useMemo } from "react";
import { Languages, Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Language {
  code: string;
  name: string;
  native: string;
}

const POPULAR_CODES = ["en", "hi", "te", "es", "fr", "zh", "ar", "pt", "de", "ja", "ko", "ru"];

const ALL_LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "my", name: "Burmese", native: "မြန်မာ" },
  { code: "km", name: "Khmer", native: "ខ្មែរ" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan" },
  { code: "kk", name: "Kazakh", native: "Қазақ" },
  { code: "uz", name: "Uzbek", native: "Oʻzbek" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ" },
  { code: "ky", name: "Kyrgyz", native: "Кыргыз" },
  { code: "tk", name: "Turkmen", native: "Türkmen" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
  { code: "xh", name: "Xhosa", native: "isiXhosa" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "so", name: "Somali", native: "Soomaali" },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda" },
  { code: "sn", name: "Shona", native: "chiShona" },
  { code: "mg", name: "Malagasy", native: "Malagasy" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "mk", name: "Macedonian", native: "Македонски" },
  { code: "bs", name: "Bosnian", native: "Bosanski" },
  { code: "mt", name: "Maltese", native: "Malti" },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "ga", name: "Irish", native: "Gaeilge" },
  { code: "cy", name: "Welsh", native: "Cymraeg" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig" },
  { code: "eu", name: "Basque", native: "Euskara" },
  { code: "ca", name: "Catalan", native: "Català" },
  { code: "gl", name: "Galician", native: "Galego" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch" },
  { code: "fy", name: "Frisian", native: "Frysk" },
  { code: "be", name: "Belarusian", native: "Беларуская" },
  { code: "la", name: "Latin", native: "Latina" },
  { code: "eo", name: "Esperanto", native: "Esperanto" },
  { code: "jv", name: "Javanese", native: "Basa Jawa" },
  { code: "su", name: "Sundanese", native: "Basa Sunda" },
  { code: "ceb", name: "Cebuano", native: "Cebuano" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl Ayisyen" },
  { code: "ku", name: "Kurdish", native: "Kurdî" },
  { code: "ps", name: "Pashto", native: "پښتو" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "yi", name: "Yiddish", native: "ייִדיש" },
  { code: "co", name: "Corsican", native: "Corsu" },
  { code: "oc", name: "Occitan", native: "Occitan" },
  { code: "br", name: "Breton", native: "Brezhoneg" },
  { code: "mi", name: "Māori", native: "Te Reo Māori" },
  { code: "sm", name: "Samoan", native: "Gagana Samoa" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi" },
  { code: "ny", name: "Chichewa", native: "Chichewa" },
  { code: "st", name: "Sesotho", native: "Sesotho" },
  { code: "tn", name: "Tswana", native: "Setswana" },
  { code: "ts", name: "Tsonga", native: "Xitsonga" },
  { code: "ve", name: "Venda", native: "Tshivenḓa" },
  { code: "nr", name: "South Ndebele", native: "isiNdebele" },
  { code: "ss", name: "Swati", native: "SiSwati" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ" },
  { code: "wo", name: "Wolof", native: "Wolof" },
  { code: "ff", name: "Fula", native: "Fulfulde" },
  { code: "ln", name: "Lingala", native: "Lingála" },
  { code: "lg", name: "Luganda", native: "Luganda" },
  { code: "tw", name: "Twi", native: "Twi" },
  { code: "ak", name: "Akan", native: "Akan" },
  { code: "ee", name: "Ewe", native: "Eʋegbe" },
  { code: "bm", name: "Bambara", native: "Bamanankan" },
  { code: "sg", name: "Sango", native: "Sängö" },
  { code: "kr", name: "Kanuri", native: "Kanuri" },
  { code: "om", name: "Oromo", native: "Afaan Oromoo" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "bo", name: "Tibetan", native: "བོད་སྐད" },
  { code: "dz", name: "Dzongkha", native: "རྫོང་ཁ" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = ALL_LANGUAGES.find(l => l.code === value) ?? ALL_LANGUAGES[0];

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const matches = ALL_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.includes(q)
    );
    if (!q) {
      const popular = matches.filter(l => POPULAR_CODES.includes(l.code));
      const rest = matches.filter(l => !POPULAR_CODES.includes(l.code));
      return { popular, rest };
    }
    return { popular: [], rest: matches };
  }, [search]);

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-mono rounded-md px-2 py-1 cursor-pointer transition-colors",
          "bg-background border border-border text-foreground hover:bg-accent/50",
          "focus:outline-none focus:ring-1 focus:ring-primary/50"
        )}
      >
        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{selected.native}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto overscroll-contain p-1">
            {filtered.popular.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular
                </div>
                {filtered.popular.map(l => (
                  <LangItem key={l.code} lang={l} selected={value === l.code} onSelect={handleSelect} />
                ))}
                <div className="mx-2 my-1 h-px bg-border" />
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  All Languages
                </div>
              </>
            )}
            {filtered.rest.length > 0 ? (
              filtered.rest.map(l => (
                <LangItem key={l.code} lang={l} selected={value === l.code} onSelect={handleSelect} />
              ))
            ) : (
              filtered.popular.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">No languages found</div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LangItem({ lang, selected, onSelect }: { lang: Language; selected: boolean; onSelect: (c: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lang.code)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors",
        selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent/50"
      )}
    >
      <span className="font-medium flex-1 text-left">{lang.name}</span>
      <span className="text-muted-foreground text-[11px]">{lang.native}</span>
      {selected && <Check className="h-3 w-3 text-primary shrink-0" />}
    </button>
  );
}
