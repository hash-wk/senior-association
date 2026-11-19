"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, API_URL, type MeetingDetail } from "@/lib/api";

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [present, setPresent] = useState<Set<number>>(new Set());
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchMeeting() {
      try {
        const res = await apiFetch(`${API_URL}/api/meetings/${id}`);
        if (res.status === 404) {
          if (!cancelled) setError("Meeting not found.");
          return;
        }
        if (!res.ok) throw new Error();
        const data: MeetingDetail = await res.json();
        if (cancelled) return;
        setMeeting(data);
        setPresent(new Set(data.members.filter((m) => m.present).map((m) => m.memberId)));
        setError("");
      } catch {
        if (!cancelled) setError("Could not load the meeting. Is the backend running?");
      }
    }
    fetchMeeting();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!meeting) return <main className="p-6">Loading...</main>;

  const term = q.trim().toLowerCase();
  const shown = meeting.members.filter(
    (m) =>
      !term ||
      m.fullName.toLowerCase().includes(term) ||
      m.nic.toLowerCase().includes(term) ||
      (m.village ?? "").toLowerCase().includes(term)
  );

  function toggle(memberId: number) {
    setMessage("");
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  function markShownPresent() {
    setMessage("");
    setPresent((prev) => {
      const next = new Set(prev);
      shown.forEach((m) => next.add(m.memberId));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await apiFetch(`${API_URL}/api/meetings/${id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentMemberIds: [...present] }),
      });
      if (!res.ok) throw new Error();
      setMessage(`Saved. ${present.size} present.`);
    } catch {
      setMessage("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const unpaid = meeting.isAnnual ? meeting.members.filter((m) => !m.annualPaid).length : 0;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/meetings" className="text-blue-600 hover:underline">
        &larr; Meetings
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{meeting.title}</h1>
      <p className="text-sm text-gray-500">
        {meeting.date.slice(0, 10)} · {meeting.isAnnual ? "Annual meeting" : "Regular meeting"}
      </p>
      <p className="mt-2">
        Present: <strong>{present.size}</strong> of {meeting.members.length} active members
        {meeting.isAnnual && ` · ${unpaid} have not paid the ${meeting.year} annual fee`}
      </p>

      <div className="my-4 flex flex-wrap items-center gap-2">
        <input
          className="w-64 rounded border p-2"
          placeholder="Search name, NIC or village"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={markShownPresent} className="rounded border px-3 py-2 hover:bg-gray-100 hover:text-gray-900">
          Mark shown as present
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>
        {message && <span className="text-sm">{message}</span>}
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b bg-gray-100 text-gray-900">
            <th className="p-2">Present</th>
            <th className="p-2">Name</th>
            <th className="p-2">NIC</th>
            <th className="p-2">Village</th>
            {meeting.isAnnual && <th className="p-2">{meeting.year} annual fee</th>}
          </tr>
        </thead>
        <tbody>
          {shown.map((m) => (
            <tr key={m.memberId} className="border-b">
              <td className="p-2">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={present.has(m.memberId)}
                  onChange={() => toggle(m.memberId)}
                />
              </td>
              <td className="p-2">{m.fullName}</td>
              <td className="p-2">{m.nic}</td>
              <td className="p-2">{m.village ?? "-"}</td>
              {meeting.isAnnual && (
                <td className={`p-2 ${m.annualPaid ? "text-green-500" : "text-amber-500"}`}>
                  {m.annualPaid ? "Paid" : "Not paid"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <p className="mt-4 text-gray-500">No members match your search.</p>}
    </main>
  );
}