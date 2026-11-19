import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Senior Citizens Association",
  description: "Members, payments, meetings and funeral benefits",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-blue-700 shadow">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-3">
            <span className="font-semibold text-white">Senior Association</span>
              <Link href="/dashboard" className="text-sm font-medium text-blue-100! hover:text-white!">
              Dashboard
              </Link>
              <Link href="/members" className="text-sm font-medium !text-blue-100 hover:!text-white">
              Members
              </Link>
              <Link href="/meetings" className="text-sm font-medium !text-blue-100 hover:!text-white">
              Meetings
              </Link>
              <Link href="/claims" className="text-sm font-medium text-blue-100! hover:text-white!">
              Claims
              </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}