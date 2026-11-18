"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, type Meeting } from "@/lib/api";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isAnnual, setIsAnnual] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchMeetings() {
      try {
        const res = await fetch(`${API_URL}/api/meetings`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        setMeetings(data);
        setError("");
      } catch {
        if (!cancelled) setError("Could not load meetings. Is the backend running?");
      }
    }
    fetchMeetings();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function createMeeting() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, isAnnual }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setIsAnnual(false);
      setReloadKey((k) => k + 1);
    } catch {
      setError("Could not create the meeting. Check the title and date.");
    } finally {
      setSaving(false);
    }
  }

  const input = "rounded border p-2";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/members" className="text-blue-600 hover:underline">
        &larr; Members
      </Link>
      <h1 className="mb-4 mt-3 text-2xl font-semibold">Meetings</h1>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          className={`${input} w-64`}
          placeholder="Meeting title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={isAnnual} onChange={(e) => setIsAnnual(e.target.checked)} />
          Annual meeting
        </label>
        <button
          onClick={createMeeting}
          disabled={saving || !title.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create meeting"}
        </button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b bg-gray-100 text-gray-900">
            <th className="p-2">Title</th>
            <th className="p-2">Date</th>
            <th className="p-2">Type</th>
            <th className="p-2">Present</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="p-2">
                <Link href={`/meetings/${m.id}`} className="text-blue-600 hover:underline">
                  {m.title}
                </Link>
              </td>
              <td className="p-2">{m.date.slice(0, 10)}</td>
              <td className="p-2">{m.isAnnual ? "Annual" : "Regular"}</td>
              <td className="p-2">{m.presentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {meetings.length === 0 && !error && <p className="mt-4 text-gray-500">No meetings yet.</p>}
    </main>
  );
}