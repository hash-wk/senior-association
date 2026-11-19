import type { Metadata } from "next";
import type { ReactNode } from "react";
import NavBar from "./NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Senior Citizens Association",
  description: "Members, payments, meetings and funeral benefits",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}