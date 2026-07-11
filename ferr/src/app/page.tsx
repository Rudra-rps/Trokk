"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TEMPLATES = [
  { id: "company", label: "Company Research", placeholder: "Research a company's products, team, market position, and competitors..." },
  { id: "startup", label: "Startup Due Diligence", placeholder: "Evaluate a startup's funding, team, traction, and market opportunity..." },
  { id: "crypto", label: "Crypto Analysis", placeholder: "Analyze a token's tokenomics, on-chain metrics, and protocol security..." },
  { id: "security", label: "Security Investigation", placeholder: "Investigate a domain, IP, or security incident..." },
  { id: "competitor", label: "Competitor Analysis", placeholder: "Compare features, pricing, and market positioning between competitors..." },
];

export default function LandingPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    router.push(`/dashboard?q=${encodeURIComponent(question.trim())}`);
  };

  const pickTemplate = (placeholder: string) => {
    router.push(`/dashboard?q=${encodeURIComponent(placeholder)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <span className="text-lg font-semibold tracking-tight">Trokk</span>
        <Link href="/investigations" className="text-sm text-dim hover:text-text transition-colors">
          Investigations →
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 max-w-2xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            One Question.<br className="sm:hidden" /> Many Expert Agents.
          </h1>
          <p className="text-lg text-dim leading-relaxed">
            Evidence. Reasoning. Consensus.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full mb-12">
          <div className="card p-1 flex gap-2 focus-within:border-accent-border transition-colors">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to investigate?"
              rows={3}
              className="flex-1 bg-transparent border-none outline-none resize-none text-text placeholder:text-muted text-base px-4 py-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Starting..." : "Investigate →"}
            </button>
          </div>
        </form>

        <div className="w-full">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Investigation Templates</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => pickTemplate(t.placeholder)}
                className="card card-hover p-4 text-left text-sm text-text-secondary hover:text-text transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-border">
        Trokk — AI Intelligence Operating System
      </footer>
    </div>
  );
}
