"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, type Member } from "@/lib/api";



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
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <Link
          href="/members/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add member
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, NIC, village or phone"
        className="mb-4 w-full rounded border p-2"
      />

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b bg-gray-100 text-gray-900">
            <th className="p-2">Name</th>
            <th className="p-2">NIC</th>
            <th className="p-2">Village</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="p-2">
                <Link href={`/members/${m.id}`} className="text-blue-600 hover:underline">
                 {m.fullName}
      </Link>
              </td>
              <td className="p-2">{m.nic}</td>
              <td className="p-2">{m.village ?? "-"}</td>
              <td className="p-2">{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && members.length === 0 && !error && (
        <p className="mt-4 text-gray-500">No members found.</p>
      )}
    </main>
  );
}