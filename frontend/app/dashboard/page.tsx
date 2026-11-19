"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, API_URL, type Dashboard } from "@/lib/api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TYPE_LABELS: Record<string, string> = {
  NEW_MEMBERSHIP: "New membership",
  MONTHLY: "Monthly fees",
  ANNUAL: "Annual fees",
};

const money = (n: number) => n.toLocaleString();

function Card({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`${API_URL}/api/dashboard`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Could not load the dashboard. Is the backend running?");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <main className="mx-auto max-w-5xl p-6 text-red-600">{error}</main>;
  if (!data) return <main className="mx-auto max-w-5xl p-6">Loading...</main>;

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Fund balance"
          value={money(data.balance)}
          tone={data.balance < 0 ? "text-red-600" : "text-green-700"}
        />
        <Card label="Total collected" value={money(data.totalIn)} />
        <Card label={`Paid out (${data.claimsCount} claims)`} value={money(data.totalOut)} />
        <Card label="Active members" value={String(data.activeMembers)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold">Income by type</h2>
          <table className="w-full text-left">
            <tbody>
              {data.incomeByType.map((t) => (
                <tr key={t.type} className="border-t border-slate-100">
                  <td>{TYPE_LABELS[t.type] ?? t.type}</td>
                  <td className="text-right">{money(t.total)}</td>
                </tr>
              ))}
              {data.incomeByType.length === 0 && (
                <tr>
                  <td className="text-slate-500">No payments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Recent claims</h2>
          <table className="w-full text-left">
            <tbody>
              {data.recentClaims.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td>
                    {c.deceasedName}
                    <span className="block text-xs text-slate-500">
                      {c.memberName} · {c.dateOfDeath.slice(0, 10)}
                    </span>
                  </td>
                  <td className="text-right">{money(c.amountPaid)}</td>
                </tr>
              ))}
              {data.recentClaims.length === 0 && (
                <tr>
                  <td className="text-slate-500">No claims yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Not paid for {MONTHS[data.month - 1]} {data.year} ({data.overdueMonthly.length})
          </h2>
          <p className="text-sm text-slate-500">
            {data.annualUnpaid} member{data.annualUnpaid === 1 ? "" : "s"} have not paid the {data.year} annual fee
          </p>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Village</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {data.overdueMonthly.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td>
                  <Link href={`/members/${m.id}`} className="font-medium hover:underline">
                    {m.fullName}
                  </Link>
                </td>
                <td>{m.village ?? "-"}</td>
                <td>{m.phone ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.overdueMonthly.length === 0 && (
          <p className="mt-2 text-green-700">Everyone has paid this month.</p>
        )}
      </section>
    </main>
  );
}