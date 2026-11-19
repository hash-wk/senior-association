"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, type Member, type MemberDetail } from "@/lib/api";

export default function NewClaimPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [member, setMember] = useState<MemberDetail | null>(null);

  const [who, setWho] = useState("SELF");
  const [dateOfDeath, setDateOfDeath] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [reason, setReason] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Search members as the user types
  useEffect(() => {
    if (!q.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/members?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) setResults(await res.json());
      } catch {
        setError("Could not search members. Is the backend running?");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Load the chosen member with relatives and eligibility
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/members/${selectedId}`);
        if (!res.ok) throw new Error();
        const data: MemberDetail = await res.json();
        if (!cancelled) setMember(data);
      } catch {
        if (!cancelled) setError("Could not load the member.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function chooseMember(m: Member) {
    setSelectedId(m.id);
    setMember(null);
    setWho("SELF");
    setReason("");
    setError("");
    setQ("");
  }

  async function submit() {
    if (!member) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        memberId: member.id,
        relativeId: who === "SELF" ? null : Number(who),
        dateOfDeath,
        amountPaid: Number(amount),
        approvedBy,
      };
      if (!member.eligibility.eligible) body.overrideReason = reason;

      const res = await fetch(`${API_URL}/api/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/claims");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Please check the form.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const e = member?.eligibility;
  const candidates = member?.relatives.filter((r) => !r.isDeceased) ?? [];
  const missing: string[] = [];
if (!member) missing.push("a member");
if (!dateOfDeath) missing.push("date of death");
if (!(Number(amount) > 0)) missing.push("amount");
if (!approvedBy.trim()) missing.push("approved by");
if (e && !e.eligible && reason.trim().length < 3) missing.push("override reason");
const canSave = missing.length === 0;

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <Link href="/claims" className="text-sm">
        &larr; Back to claims
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold">New funeral claim</h1>

      <h2 className="mb-2 font-semibold">1. Member</h2>
      {member ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <div>
            <p className="font-medium">{member.fullName}</p>
            <p className="text-sm text-slate-500">
              {member.nic} · {member.village ?? "-"}
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-blue-600"
            onClick={() => {
              setSelectedId(null);
              setMember(null);
            }}
          >
            Change
          </button>
        </div>
      ) : selectedId !== null ? (
        <p className="text-slate-500">Loading member...</p>
      ) : (
        <>
          <input
            className="w-full"
            placeholder="Search by name, NIC, village or phone"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
          />
          {q.trim() && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {results.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => chooseMember(m)}
                  >
                    {m.fullName} <span className="text-sm text-slate-500">· {m.nic}</span>
                  </button>
                </li>
              ))}
              {results.length === 0 && <li className="px-3 py-2 text-slate-500">No matches.</li>}
            </ul>
          )}
        </>
      )}

      {member && e && (
        <>
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              e.eligible ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"
            }`}
          >
            {e.eligible
              ? `Eligible: ${e.paidMonths} monthly payments recorded (${e.required} required).`
              : `Not yet eligible: ${e.paidMonths} of ${e.required} required monthly payments. An override reason is needed to continue.`}
          </div>

          <h2 className="mb-2 mt-6 font-semibold">2. Who passed away</h2>
          <select className="w-full" value={who} onChange={(ev) => setWho(ev.target.value)}>
            <option value="SELF">The member ({member.fullName})</option>
            {candidates.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.relationship.replaceAll("_", " ").toLowerCase()})
              </option>
            ))}
          </select>

          <h2 className="mb-2 mt-6 font-semibold">3. Details</h2>
          <div className="space-y-3">
            <label className="block text-sm">
              Date of death
              <input
                type="date"
                className="w-full"
                value={dateOfDeath}
                onChange={(ev) => setDateOfDeath(ev.target.value)}
              />
            </label>
            <label className="block text-sm">
              Amount paid
              <input
                type="number"
                min="0"
                className="w-full"
                value={amount}
                onChange={(ev) => setAmount(ev.target.value)}
              />
            </label>
            <label className="block text-sm">
              Approved by
              <input
                className="w-full"
                placeholder="Name of the committee member approving"
                value={approvedBy}
                onChange={(ev) => setApprovedBy(ev.target.value)}
              />
            </label>
            {!e.eligible && (
              <label className="block text-sm">
                Override reason (required)
                <textarea
                  className="w-full"
                  rows={3}
                  placeholder="Why is the committee making an exception?"
                  value={reason}
                  onChange={(ev) => setReason(ev.target.value)}
                />
              </label>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}

        {member && missing.length > 0 && (
        <p className="mt-4 text-sm text-amber-700">Still needed: {missing.join(", ")}.</p>
        )}

      <div className="mt-6">
        <button
          onClick={submit}
          disabled={saving || !canSave}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Record claim"}
        </button>
      </div>
    </main>
  );
}