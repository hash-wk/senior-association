import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getEligibility } from "../lib/eligibility.js";

const router = Router();

const claimSchema = z.object({
  memberId: z.number().int(),
  relativeId: z.number().int().nullable().optional(), // null = the member themselves
  dateOfDeath: z.coerce.date(),
  amountPaid: z.number().positive(),
  approvedBy: z.string().trim().min(1),
  overrideReason: z.string().trim().optional(),
});

// List all claims
router.get("/", async (_req, res) => {
  const claims = await prisma.funeralClaim.findMany({
    orderBy: { dateOfDeath: "desc" },
    include: {
      member: { select: { fullName: true } },
      relative: { select: { relationship: true } },
    },
  });
  res.json(
    claims.map((c) => ({
      id: c.id,
      memberId: c.memberId,
      memberName: c.member.fullName,
      deceasedName: c.deceasedName,
      relationship: c.relative?.relationship ?? "SELF",
      dateOfDeath: c.dateOfDeath,
      amountPaid: c.amountPaid,
      paidMonthsAtClaimTime: c.paidMonthsAtClaimTime,
      overrideReason: c.overrideReason,
      approvedBy: c.approvedBy,
    }))
  );
});

// Create a claim
router.post("/", async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the form.", errors: parsed.error.flatten() });
    return;
  }
  const { memberId, relativeId, dateOfDeath, amountPaid, approvedBy } = parsed.data;
  const overrideReason = parsed.data.overrideReason || undefined;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    res.status(404).json({ error: "Member not found." });
    return;
  }
  if (member.status === "DECEASED") {
    res.status(400).json({ error: "This member is already recorded as deceased." });
    return;
  }

  let deceasedName = member.fullName;

  if (relativeId) {
    const relative = await prisma.familyRelation.findUnique({
      where: { id: relativeId },
      include: { claims: { select: { id: true } } },
    });
    if (!relative || relative.memberId !== memberId) {
      res.status(404).json({ error: "That family member does not belong to this member." });
      return;
    }
    if (relative.isDeceased || relative.claims.length > 0) {
      res.status(409).json({ error: "A claim was already recorded for this person." });
      return;
    }
    deceasedName = relative.name;
  } else {
    const existing = await prisma.funeralClaim.findFirst({ where: { memberId, relativeId: null } });
    if (existing) {
      res.status(409).json({ error: "A claim was already recorded for this member." });
      return;
    }
  }

  // The 5-month rule
  const eligibility = await getEligibility(memberId);
  if (!eligibility.eligible && (!overrideReason || overrideReason.length < 3)) {
    res.status(422).json({
      error: `Member has paid ${eligibility.paidMonths} of ${eligibility.required} required months. An override reason is required.`,
      eligibility,
    });
    return;
  }

  const claim = await prisma.$transaction(async (tx) => {
    const created = await tx.funeralClaim.create({
      data: {
        memberId,
        relativeId: relativeId ?? null,
        deceasedName,
        dateOfDeath,
        amountPaid,
        paidMonthsAtClaimTime: eligibility.paidMonths,
        overrideReason: eligibility.eligible ? null : overrideReason,
        approvedBy,
      },
    });
    if (relativeId) {
      await tx.familyRelation.update({ where: { id: relativeId }, data: { isDeceased: true } });
    } else {
      await tx.member.update({ where: { id: memberId }, data: { status: "DECEASED" } });
    }
    return created;
  });

  res.status(201).json(claim);
});

export default router;