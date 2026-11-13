import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/members", async (_req, res) => {
  const members = await prisma.member.findMany({ orderBy: { fullName: "asc" } });
  res.json(members);
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));