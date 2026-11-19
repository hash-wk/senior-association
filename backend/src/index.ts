import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requireAuth } from "./lib/auth.js";
import authRouter from "./routes/auth.js";
import membersRouter from "./routes/members.js";
import paymentsRouter from "./routes/payments.js";
import meetingsRouter from "./routes/meetings.js";
import claimsRouter from "./routes/claims.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/members", requireAuth, membersRouter);
app.use("/api/payments", requireAuth, paymentsRouter);
app.use("/api/meetings", requireAuth, meetingsRouter);
app.use("/api/claims", requireAuth, claimsRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));