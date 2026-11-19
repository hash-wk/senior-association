import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { COOKIE_NAME, cookieOptions, requireAuth, signToken } from "../lib/auth.js";
import { rateLimit } from "express-rate-limit";
import { logAudit } from "../lib/audit.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                // max 10 login attempts per window per IP address
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter your email and password." });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  const ok = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  res.cookie(COOKIE_NAME, signToken(user.id), { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  await logAudit({ id: user.id, name: user.name }, "LOGIN", "User", user.id, "Logged in");
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;