"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const RELATIONSHIPS = [
  ["FATHER", "Father"],
  ["MOTHER", "Mother"],
  ["CHILD", "Child"],
  ["FATHER_IN_LAW", "Father-in-law"],
  ["MOTHER_IN_LAW", "Mother-in-law"],
];

export default function NewMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    nic: "",
    phone: "",
    address: "",
    village: "",
    joinDate: new Date().toISOString().slice(0, 10),
  });
  const [relatives, setRelatives] = useState([{ name: "", relationship: "FATHER" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateRelative = (i: number, key: string, value: string) =>
    setRelatives((list) => list.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          relatives: relatives.filter((r) => r.name.trim() !== ""),
        }),
      });
      if (res.status === 409) {
        setError("A member with this NIC already exists.");
      } else if (!res.ok) {
        setError("Please check the form. Name, NIC and join date are required.");
      } else {
        router.push("/members");
      }
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded border p-2";

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add member</h1>

      <div className="space-y-3">
        <input className={input} placeholder="Full name" value={form.fullName}
          onChange={(e) => setField("fullName", e.target.value)} />
        <input className={input} placeholder="NIC" value={form.nic}
          onChange={(e) => setField("nic", e.target.value)} />
        <input className={input} placeholder="Phone" value={form.phone}
          onChange={(e) => setField("phone", e.target.value)} />
        <input className={input} placeholder="Village" value={form.village}
          onChange={(e) => setField("village", e.target.value)} />
        <input className={input} placeholder="Address" value={form.address}
          onChange={(e) => setField("address", e.target.value)} />
        <label className="block text-sm">
          Join date
          <input type="date" className={input} value={form.joinDate}
            onChange={(e) => setField("joinDate", e.target.value)} />
        </label>
      </div>

      <h2 className="mb-2 mt-6 font-semibold">Family members covered</h2>
      {relatives.map((r, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input className={input} placeholder="Name" value={r.name}
            onChange={(e) => updateRelative(i, "name", e.target.value)} />
          <select className="rounded border p-2" value={r.relationship}
            onChange={(e) => updateRelative(i, "relationship", e.target.value)}>
            {RELATIONSHIPS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="button" className="px-2 text-red-600"
            onClick={() => setRelatives((list) => list.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="text-blue-600"
        onClick={() => setRelatives((list) => [...list, { name: "", relationship: "MOTHER" }])}>
        + Add another
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      <div className="mt-6">
        <button onClick={handleSubmit} disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save member"}
        </button>
      </div>
    </main>
  );
}