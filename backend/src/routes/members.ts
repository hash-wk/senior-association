import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getEligibility } from "../lib/eligibility.js";
import { requireRole } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

const memberSchema = z.object({
  fullName: z.string().min(1),
  nic: z.string().min(5),
  phone: z.string().optional(),
  address: z.string().optional(),
  village: z.string().optional(),
  joinDate: z.coerce.date(),
  relatives: z
    .array(
      z.object({
        name: z.string().min(1),
        relationship: z.enum(["FATHER", "MOTHER", "CHILD", "FATHER_IN_LAW", "MOTHER_IN_LAW"]),
      })
    )
    .default([]),
});

// List + search: GET /api/members?q=kamal
router.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const members = await prisma.member.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { nic: { contains: q, mode: "insensitive" } },
            { village: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
  });
  res.json(members);
});

// Create a member with relatives
router.post("/", requireRole("ADMIN", "SECRETARY"), async (req, res) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() });
    return;
  }
  const { relatives, ...data } = parsed.data;
  try {
    const member = await prisma.member.create({
      data: { ...data, relatives: { create: relatives } },
      include: { relatives: true },
    });
    await logAudit(
      req.user,
      "CREATE_MEMBER",
      "Member",
      member.id,
      `Added member ${member.fullName} (${member.nic})`
    );
    res.status(201).json(member);
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(409).json({ error: "A member with this NIC already exists" });
      return;
    }
    throw e;
  }
});

// One member with relatives, payments, claims and eligibility
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      relatives: true,
      payments: { orderBy: { paidAt: "desc" } },
      claims: true,
    },
  });
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json({ ...member, eligibility: await getEligibility(id) });
});

export default router;