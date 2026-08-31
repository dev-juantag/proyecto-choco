require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Paciente';
    `;
    console.log("COLUMNS IN DATABASE:");
    console.log(columns);
  } catch (err) {
    console.error("Error querying database:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
