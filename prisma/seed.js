import bcrypt from "bcrypt";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: {
      username: "admin",
    },

    update: {
      password,
      role: "SUPER_ADMIN",
    },

    create: {
      username: "admin",
      email: "admin@inventory.local",
      password,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Super Admin berhasil dibuat:");
  console.log({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });