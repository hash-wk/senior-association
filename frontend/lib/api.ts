export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Relative = {
  id: number;
  name: string;
  relationship: string;
  isDeceased: boolean;
};

export type Member = {
  id: number;
  fullName: string;
  nic: string;
  phone: string | null;
  village: string | null;
  joinDate: string;
  status: "ACTIVE" | "INACTIVE" | "DECEASED";
};

export type Payment = {
  id: number;
  type: "NEW_MEMBERSHIP" | "MONTHLY" | "ANNUAL";
  amount: string; // Prisma sends decimals as strings
  paidAt: string;
  periodMonth: number | null;
  periodYear: number | null;
};

export type Eligibility = {
  required: number;
  paidMonths: number;
  eligible: boolean;
  monthsNeeded: number;
};

export type MemberDetail = Member & {
  address: string | null;
  relatives: Relative[];
  payments: Payment[];
  eligibility: Eligibility;
};

export type Meeting = {
  id: number;
  title: string;
  date: string;
  isAnnual: boolean;
  presentCount: number;
};

export type AttendanceRow = {
  memberId: number;
  fullName: string;
  nic: string;
  village: string | null;
  present: boolean;
  annualPaid: boolean;
};

export type MeetingDetail = {
  id: number;
  title: string;
  date: string;
  isAnnual: boolean;
  year: number;
  members: AttendanceRow[];
};

export type Claim = {
  id: number;
  memberId: number;
  memberName: string;
  deceasedName: string;
  relationship: string;
  dateOfDeath: string;
  amountPaid: string;
  paidMonthsAtClaimTime: number;
  overrideReason: string | null;
  approvedBy: string;
};

export type Dashboard = {
  month: number;
  year: number;
  totalIn: number;
  totalOut: number;
  balance: number;
  claimsCount: number;
  activeMembers: number;
  incomeByType: { type: string; total: number }[];
  overdueMonthly: { id: number; fullName: string; village: string | null; phone: string | null }[];
  annualUnpaid: number;
  recentClaims: {
    id: number;
    deceasedName: string;
    memberName: string;
    dateOfDeath: string;
    amountPaid: number;
  }[];
};

export async function apiFetch(input: string, init: RequestInit = {}) {
  const res = await fetch(input, { ...init, credentials: "include" });
  if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
  if (res.status === 403 && typeof window !== "undefined") {
    alert("You do not have permission to do this.");
  }
  return res;
}