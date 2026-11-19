"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed.");
      }
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto mt-16 w-full max-w-sm p-6">
      <h1 className="mb-1 text-2xl font-semibold">Senior Association</h1>
      <p className="mb-6 text-sm text-slate-500">Committee login</p>

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full"
          type="email"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || !email || !password}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Signing in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}