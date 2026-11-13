import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "min_paid_months" },
    update: {},
    create: { key: "min_paid_months", value: "5" },
  });
}

main().finally(() => prisma.$disconnect());