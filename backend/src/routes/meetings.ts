import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

const meetingSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  isAnnual: z.boolean().default(false),
});

// List meetings with the number of members present
router.get("/", async (_req, res) => {
  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
    include: { attendance: { select: { status: true } } },
  });
  res.json(
    meetings.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      isAnnual: m.isAnnual,
      presentCount: m.attendance.filter((a) => a.status === "PRESENT").length,
    }))
  );
});

// Create a meeting
router.post("/", requireRole("ADMIN", "SECRETARY"), async (req, res) => {
  const parsed = meetingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() });
    return;
  }
  const meeting = await prisma.meeting.create({ data: parsed.data });
  await logAudit(req.user, "CREATE_MEETING", "Meeting", meeting.id, `Created meeting "${meeting.title}"`);
  res.status(201).json(meeting);
});

// One meeting with every active member, their attendance and annual fee status
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const year = meeting.date.getUTCFullYear();
  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    orderBy: { fullName: "asc" },
    include: {
      attendance: { where: { meetingId: id } },
      payments: { where: { type: "ANNUAL", periodYear: year }, select: { id: true } },
    },
  });

  res.json({
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    isAnnual: meeting.isAnnual,
    year,
    members: members.map((m) => ({
      memberId: m.id,
      fullName: m.fullName,
      nic: m.nic,
      village: m.village,
      present: m.attendance[0]?.status === "PRESENT",
      annualPaid: m.payments.length > 0,
    })),
  });
});

// Save attendance: send the ids of everyone who was present
const attendanceSchema = z.object({
  presentMemberIds: z.array(z.number().int()),
});

router.put("/:id/attendance", requireRole("ADMIN", "SECRETARY"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() });
    return;
  }

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const present = new Set(parsed.data.presentMemberIds);
  const activeMembers = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  await prisma.$transaction(
    activeMembers.map((m) => {
      const status = present.has(m.id) ? "PRESENT" : "ABSENT";
      return prisma.attendance.upsert({
        where: { meetingId_memberId: { meetingId: id, memberId: m.id } },
        update: { status },
        create: { meetingId: id, memberId: m.id, status },
      });
    })
  );

  await logAudit(
    req.user,
    "SAVE_ATTENDANCE",
    "Meeting",
    id,
    `Saved attendance for "${meeting.title}" (${present.size} present)`
  );
  res.json({ ok: true, presentCount: present.size });
});

export default router;