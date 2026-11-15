import { prisma } from "./prisma.js";

export async function getEligibility(memberId: number) {
  const setting = await prisma.setting.findUnique({
    where: { key: "min_paid_months" },
  });
  const required = setting ? parseInt(setting.value, 10) : 5;

  const paidMonths = await prisma.payment.count({
    where: { memberId, type: "MONTHLY" },
  });

  return {
    required,
    paidMonths,
    eligible: paidMonths >= required,
    monthsNeeded: Math.max(0, required - paidMonths),
  };
}