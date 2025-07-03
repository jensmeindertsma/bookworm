import { Prisma, PrismaClient } from "../generated/prisma/client";
import { getEnvironmentVariable } from "./environment.server";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

const databaseUrl = getEnvironmentVariable("APPLICATION_DATABASE_URL");

const adapter = new PrismaBetterSQLite3({
  url: databaseUrl,
});

export const database = new PrismaClient({ adapter });

export { Prisma };
