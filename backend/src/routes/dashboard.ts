import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const [income, payouts, byType, activeMembers, overdueMonthly, annualUnpaid, recentClaims] =
    await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.funeralClaim.aggregate({ _sum: { amountPaid: true }, _count: true }),
      prisma.payment.groupBy({ by: ["type"], _sum: { amount: true } }),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.member.findMany({
        where: {
          status: "ACTIVE",
          joinDate: { lte: endOfMonth },
          payments: { none: { type: "MONTHLY", periodMonth: month, periodYear: year } },
        },
        select: { id: true, fullName: true, village: true, phone: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.member.count({
        where: {
          status: "ACTIVE",
          payments: { none: { type: "ANNUAL", periodYear: year } },
        },
      }),
      prisma.funeralClaim.findMany({
        orderBy: { dateOfDeath: "desc" },
        take: 5,
        include: { member: { select: { fullName: true } } },
      }),
    ]);

  const totalIn = Number(income._sum.amount ?? 0);
  const totalOut = Number(payouts._sum.amountPaid ?? 0);

  res.json({
    month,
    year,
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
    claimsCount: payouts._count,
    activeMembers,
    incomeByType: byType.map((t) => ({ type: t.type, total: Number(t._sum.amount ?? 0) })),
    overdueMonthly,
    annualUnpaid,
    recentClaims: recentClaims.map((c) => ({
      id: c.id,
      deceasedName: c.deceasedName,
      memberName: c.member.fullName,
      dateOfDeath: c.dateOfDeath,
      amountPaid: Number(c.amountPaid),
    })),
  });
});

export default router;