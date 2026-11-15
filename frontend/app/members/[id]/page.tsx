"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_URL, type MemberDetail } from "@/lib/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [type, setType] = useState("MONTHLY");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payError, setPayError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchMember() {
      try {
        const res = await fetch(`${API_URL}/api/members/${id}`);
        if (cancelled) return;
        if (res.status === 404) {
          setError("Member not found.");
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        setMember(data);
        setError("");
      } catch {
        if (!cancelled) setError("Could not load member. Is the backend running?");
      }
    }

    fetchMember();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  async function addPayment() {
    setSaving(true);
    setPayError("");
    try {
      const body: Record<string, unknown> = {
        memberId: Number(id),
        type,
        amount: Number(amount),
      };
      if (type === "MONTHLY") {
        body.periodMonth = month;
        body.periodYear = year;
      }
      if (type === "ANNUAL") body.periodYear = year;

      const res = await fetch(`${API_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) setPayError("This payment is already recorded for that period.");
      else if (!res.ok) setPayError("Please enter a valid amount.");
      else {
        setAmount("");
        setReloadKey((k) => k + 1);
      }
    } catch {
      setPayError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!member) return <main className="p-6">Loading...</main>;

  const { eligibility: e } = member;
  const input = "rounded border p-2";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/members" className="text-blue-600 hover:underline">
        &larr; Back to members
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{member.fullName}</h1>
        <span
          className={`rounded px-3 py-1 text-sm text-white ${
            e.eligible ? "bg-green-600" : "bg-amber-600"
          }`}
        >
          {e.eligible
            ? "Eligible for funeral benefit"
            : `Not yet eligible: needs ${e.monthsNeeded} more month${e.monthsNeeded === 1 ? "" : "s"}`}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Paid {e.paidMonths} of {e.required} required monthly payments
      </p>

      <section className="mt-6 grid gap-1 text-sm sm:grid-cols-2">
        <p>NIC: {member.nic}</p>
        <p>Phone: {member.phone ?? "-"}</p>
        <p>Village: {member.village ?? "-"}</p>
        <p>Joined: {member.joinDate.slice(0, 10)}</p>
        <p className="sm:col-span-2">Address: {member.address ?? "-"}</p>
      </section>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Covered family members</h2>
      {member.relatives.length === 0 ? (
        <p className="text-gray-500">None recorded.</p>
      ) : (
        <ul className="list-disc pl-6">
          {member.relatives.map((r) => (
            <li key={r.id}>
              {r.name} ({r.relationship.replaceAll("_", " ").toLowerCase()})
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 mt-6 text-lg font-semibold">Record a payment</h2>
      <div className="flex flex-wrap items-center gap-2">
        <select className={input} value={type} onChange={(ev) => setType(ev.target.value)}>
          <option value="MONTHLY">Monthly</option>
          <option value="ANNUAL">Annual</option>
          <option value="NEW_MEMBERSHIP">New membership</option>
        </select>
        <input
          className={`${input} w-32`}
          type="number"
          min="0"
          placeholder="Amount"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
        />
        {type === "MONTHLY" && (
          <select className={input} value={month} onChange={(ev) => setMonth(Number(ev.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        )}
        {type !== "NEW_MEMBERSHIP" && (
          <input
            className={`${input} w-24`}
            type="number"
            value={year}
            onChange={(ev) => setYear(Number(ev.target.value))}
          />
        )}
        <button
          onClick={addPayment}
          disabled={saving || !amount}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save payment"}
        </button>
      </div>
      {payError && <p className="mt-2 text-red-600">{payError}</p>}

      <h2 className="mb-2 mt-6 text-lg font-semibold">Payment history</h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b bg-gray-100 text-gray-900">
            <th className="p-2">Type</th>
            <th className="p-2">Period</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Recorded</th>
          </tr>
        </thead>
        <tbody>
          {member.payments.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.type.replace("_", " ")}</td>
              <td className="p-2">
                {p.periodMonth ? `${MONTHS[p.periodMonth - 1]} ` : ""}
                {p.periodYear ?? "-"}
              </td>
              <td className="p-2">{Number(p.amount).toLocaleString()}</td>
              <td className="p-2">{p.paidAt.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {member.payments.length === 0 && <p className="mt-2 text-gray-500">No payments yet.</p>}
    </main>
  );
}