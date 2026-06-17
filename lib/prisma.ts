import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prismaInstance: PrismaClient };

let prismaInstance: PrismaClient;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

function createPrismaClient(logOptions: ('query' | 'error' | 'warn')[]) {
  return new PrismaClient({
    adapter,
    log: logOptions,
  });
}

if (process.env.NODE_ENV === 'production') {
  prismaInstance = new Proxy({} as PrismaClient, {
    get(target, prop, receiver) {
      if (!globalForPrisma.prismaInstance) {
        globalForPrisma.prismaInstance = createPrismaClient(['error']);
      }
      return Reflect.get(globalForPrisma.prismaInstance, prop, receiver);
    }
  });
} else {
  // In development, also use Proxy to defer initialization
  prismaInstance = new Proxy({} as PrismaClient, {
    get(target, prop, receiver) {
      if (!globalForPrisma.prismaInstance) {
        globalForPrisma.prismaInstance = createPrismaClient(['error', 'warn']);
      }
      return Reflect.get(globalForPrisma.prismaInstance, prop, receiver);
    }
  });
}

export const prisma = prismaInstance;
