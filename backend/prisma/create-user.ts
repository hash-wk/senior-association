import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, password, name, role] = process.argv.slice(2);
  const roles = Object.values(Role);
  if (!email || !password || !name || !roles.includes(role as Role)) {
    console.log(`Usage: npx tsx prisma/create-user.ts <email> <password> "<name>" <${roles.join("|")}>`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.log("Password must be at least 8 characters.");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, role: role as Role },
    create: { email: email.toLowerCase(), name, passwordHash, role: role as Role },
  });
  console.log(`Saved ${user.role} account for ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());