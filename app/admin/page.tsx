"use client";

import { useState } from "react";

interface Lead {
  email: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  maintenance: number;
  dailyTarget: number;
  submittedAt: string;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  async function fetchLeads(passedSecret?: string) {
    const key = passedSecret || secret;
    if (!key) {
      setError("Enter the admin secret.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/leads?secret=${encodeURIComponent(key)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch leads.");
        setLoading(false);
        return;
      }

      setLeads(data.leads || []);
      setAuthenticated(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchLeads();
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center px-6">
        <div className="w-full max-w-sm fade-in">
          <div className="frost-border rounded-2xl p-6 sm:p-8">
            <h1 className="text-lg font-medium text-foreground mb-1 text-center">
              Admin Dashboard
            </h1>
            <p className="text-secondary text-sm mb-6 text-center">
              Enter the admin secret to view leads.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Admin secret"
                className="text-center"
                autoFocus
              />

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Loading..." : "View Leads"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="w-full pt-12 pb-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-foreground tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-secondary text-sm mt-1">
              Total leads:{" "}
              <span className="text-foreground font-mono">{leads.length}</span>
            </p>
          </div>
          <button
            onClick={() => fetchLeads()}
            disabled={loading}
            className="px-4 py-2 rounded-full frost-border text-secondary text-sm hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-16">
        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        {leads.length === 0 ? (
          <div className="frost-border rounded-2xl p-8 text-center fade-in">
            <p className="text-secondary">No leads collected yet.</p>
          </div>
        ) : (
          <div className="frost-border rounded-2xl overflow-hidden fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(214,235,253,0.19)]">
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Height
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Age
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Maintenance Cal
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Daily Target
                    </th>
                    <th className="px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={i}
                      className="border-b border-[rgba(214,235,253,0.09)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {lead.email}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {lead.weight}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {lead.height}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {lead.age}
                      </td>
                      <td className="px-4 py-3 text-secondary capitalize">
                        {lead.gender}
                      </td>
                      <td className="px-4 py-3 font-mono text-accent-blue">
                        {lead.maintenance}
                      </td>
                      <td className="px-4 py-3 font-mono text-accent-green">
                        {lead.dailyTarget}
                      </td>
                      <td className="px-4 py-3 text-tertiary text-xs">
                        {formatDate(lead.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer
        className="w-full py-6 text-center"
        style={{ borderTop: "1px solid rgba(214, 235, 253, 0.19)" }}
      >
        <p className="text-xs text-tertiary">
          FoodOS Admin &middot;{" "}
          <a href="/" className="text-secondary hover:text-foreground transition-colors">
            Back to calculator
          </a>
        </p>
      </footer>
    </div>
  );
}
