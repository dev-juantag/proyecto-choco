import { prisma } from "./lib/prisma";

async function main() {
  try {
    console.log("Fetching first FichaHogar...");
    const ficha = await prisma.fichaHogar.findFirst({
      include: {
        encuestador: true,
        territorio: true,
        pacientes: true,
      }
    });
    console.log("Success! Found ficha:", ficha?.id, "consecutivo:", ficha?.consecutivo);
  } catch (error) {
    console.error("Prisma query failed:", error);
  }
}

main();
