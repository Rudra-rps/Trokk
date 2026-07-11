"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "rp_admin";

const headers = () => ({
  Authorization: `Bearer ${ADMIN_KEY}`,
  "Content-Type": "application/json",
});

interface Investigation {
  id: string;
  question: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted",
  in_progress: "text-accent",
  consensus: "text-warning",
  complete: "text-success",
  failed: "text-danger",
};

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/investigations?limit=50`, { headers: headers() })
      .then((r) => r.json())
      .then((data) => setInvestigations(data.investigations || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <Link href="/" className="text-lg font-semibold tracking-tight">Trokk</Link>
        <Link href="/dashboard" className="text-sm text-dim hover:text-text transition-colors">
          New Investigation →
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">Investigations</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : investigations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-dim text-lg">No investigations yet.</p>
            <Link href="/dashboard" className="text-sm text-accent hover:text-accent-hover mt-2 inline-block">
              Start your first →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {investigations.map((inv) => (
              <Link
                key={inv.id}
                href={
                  inv.status === "complete"
                    ? `/reports/${inv.id}`
                    : `/dashboard?inv=${inv.id}`
                }
                className="card card-hover p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{inv.question}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString()}
                    {inv.completed_at && ` · completed ${new Date(inv.completed_at).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`text-xs ml-4 capitalize ${STATUS_COLORS[inv.status]}`}>
                  {inv.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
