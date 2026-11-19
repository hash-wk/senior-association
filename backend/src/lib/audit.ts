import { prisma } from "./prisma.js";

type Actor = { id: number; name: string } | undefined;

export async function logAudit(
  actor: Actor,
  action: string,
  entity: string,
  entityId: number | null,
  summary: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        userName: actor?.name ?? "unknown",
        action,
        entity,
        entityId,
        summary,
      },
    });
  } catch (e) {
    // A logging problem should never block the real action
    console.error("Audit log failed", e);
  }
}