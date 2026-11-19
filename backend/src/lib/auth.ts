import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; name: string; email: string; role: Role };
    }
  }
}

export const COOKIE_NAME = "token";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set in .env");
  return s;
}

export function signToken(userId: number) {
  return jwt.sign({ id: userId }, secret(), { expiresIn: "8h" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Please log in." });
    return;
  }
  try {
    const payload = jwt.verify(token, secret()) as { id: number };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new Error("No such user");
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Please log in." });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have permission to do this." });
      return;
    }
    next();
  };
}