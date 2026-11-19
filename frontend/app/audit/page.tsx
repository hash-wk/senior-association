"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_URL, type AuditEntry } from "@/lib/api";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`${API_URL}/api/audit`);
        if (res.status === 403) {
          if (!cancelled) setError("Only admins can view the audit log.");
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) setError("Could not load the audit log. Is the backend running?");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <p className="mb-6 text-sm text-slate-500">The latest {entries.length} actions, newest first</p>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                <td>{e.userName}</td>
                <td>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {e.action.replaceAll("_", " ").toLowerCase()}
                  </span>
                </td>
                <td>{e.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 && !error && <p className="mt-4 text-slate-500">Nothing recorded yet.</p>}
    </main>
  );
}