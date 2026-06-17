const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");
  const passwordHash = await bcrypt.hash("4dmin1strador", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "juantaguado@techtag.dev" },
    update: {
      nombre: "Juan",
      apellidos: "Taguado",
      documento: "1004628559",
      password: passwordHash,
      rol: "SUPERADMIN",
      activo: true,
      territorioId: null,
    },
    create: {
      nombre: "Juan",
      apellidos: "Taguado",
      documento: "1004628559",
      email: "juantaguado@techtag.dev",
      password: passwordHash,
      rol: "SUPERADMIN",
      activo: true,
      territorioId: null,
    }
  });

  console.log("User seeded successfully:", user.email);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
