"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";

type Me = { name: string; role: string };

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/members", "Members"],
  ["/meetings", "Meetings"],
  ["/claims", "Claims"],
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/login")) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch(`${API_URL}/api/auth/me`);
        if (res.ok && !cancelled) setMe(await res.json());
      } catch {
        if (!cancelled) setMe(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    await apiFetch(`${API_URL}/api/auth/logout`, { method: "POST" });
    setMe(null);
    router.push("/login");
  }

  if (pathname.startsWith("/login")) return null;

  return (
    <header className="bg-blue-700 shadow">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-6 py-3">
        <span className="font-semibold text-white">Senior Association</span>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="text-sm font-medium text-blue-100! hover:text-white!">
            {label}
          </Link>
        ))}
        {me?.role === "ADMIN" && (
            <Link href="/audit" className="text-sm font-medium text-blue-100! hover:text-white!">
                Audit log
            </Link>
        )}
        {me && (
          <div className="ml-auto flex items-center gap-3 text-sm text-blue-100">
            <span>
              {me.name} · {me.role.toLowerCase()}
            </span>
            <button
              onClick={logout}
              className="rounded border border-blue-300 px-3 py-1 text-white hover:bg-blue-600"
            >
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}