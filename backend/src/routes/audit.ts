import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../lib/auth.js";

const router = Router();

router.get("/", requireRole("ADMIN"), async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 100, 500);
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  res.json(logs);
});

export default router;