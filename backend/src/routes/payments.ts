import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

const paymentSchema = z
  .object({
    memberId: z.number().int(),
    type: z.enum(["NEW_MEMBERSHIP", "MONTHLY", "ANNUAL"]),
    amount: z.number().positive(),
    periodMonth: z.number().int().min(1).max(12).optional(),
    periodYear: z.number().int().min(2000).optional(),
    note: z.string().optional(),
  })
  .refine((d) => d.type !== "MONTHLY" || (d.periodMonth && d.periodYear), {
    message: "Monthly payments need periodMonth and periodYear",
  })
  .refine((d) => d.type !== "ANNUAL" || d.periodYear, {
    message: "Annual payments need periodYear",
  });

router.post("/", requireRole("ADMIN", "TREASURER"), async (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() });
    return;
  }
  try {
    const payment = await prisma.payment.create({
      data: { ...parsed.data, receivedBy: req.user!.name },
    });
    await logAudit(
      req.user,
      "RECORD_PAYMENT",
      "Payment",
      payment.id,
      `Recorded ${payment.type} payment of ${payment.amount} for member #${payment.memberId}`
    );
    res.status(201).json(payment);
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(409).json({ error: "This payment is already recorded for that period" });
      return;
    }
    if (e.code === "P2003") {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    throw e;
  }
});

export default router;