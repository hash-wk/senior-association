"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, type Member } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-200 text-slate-700",
  DECEASED: "bg-red-100 text-red-800",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/members?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Request failed");
        setMembers(await res.json());
        setError("");
      } catch {
        setError("Could not load members. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-sm text-slate-500">{members.length} shown</p>
        </div>
        <Link
          href="/members/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add member
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, NIC, village or phone"
        className="mb-4 w-full"
      />

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Name</th>
            <th>NIC</th>
            <th>Village</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td>
                <Link href={`/members/${m.id}`} className="font-medium hover:underline">
                  {m.fullName}
                </Link>
              </td>
              <td>{m.nic}</td>
              <td>{m.village ?? "-"}</td>
              <td>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status]}`}>
                  {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && members.length === 0 && !error && (
        <p className="mt-4 text-slate-500">No members found.</p>
      )}
    </main>
  );
}