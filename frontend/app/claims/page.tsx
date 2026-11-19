"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, type Claim } from "@/lib/api";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/claims`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setClaims(data);
      } catch {
        if (!cancelled) setError("Could not load claims. Is the backend running?");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Funeral claims</h1>
          <p className="text-sm text-slate-500">{claims.length} recorded</p>
        </div>
        <Link
          href="/claims/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + New claim
        </Link>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Date of death</th>
              <th>Deceased</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Months paid</th>
              <th>Approved by</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td>{c.dateOfDeath.slice(0, 10)}</td>
                <td>
                  {c.deceasedName}
                  <span className="block text-xs text-slate-500">
                    {c.relationship === "SELF" ? "Member" : c.relationship.replaceAll("_", " ").toLowerCase()}
                  </span>
                </td>
                <td>
                  <Link href={`/members/${c.memberId}`} className="hover:underline">
                    {c.memberName}
                  </Link>
                </td>
                <td>{Number(c.amountPaid).toLocaleString()}</td>
                <td>
                  {c.paidMonthsAtClaimTime}
                  {c.overrideReason && (
                    <span
                      title={c.overrideReason}
                      className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                    >
                      Override
                    </span>
                  )}
                </td>
                <td>{c.approvedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {claims.length === 0 && !error && <p className="mt-4 text-slate-500">No claims yet.</p>}
    </main>
  );
}