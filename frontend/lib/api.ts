export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Relative = {
  id: number;
  name: string;
  relationship: string;
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