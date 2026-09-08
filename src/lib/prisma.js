// Load environment variables from the .env file.
//
// This is important because our DATABASE_URL is stored inside .env.
// When we run this file directly with Node/tsx, dotenv loads those
// variables into process.env so Prisma can access DATABASE_URL.
import "dotenv/config";


// Import the PrismaClient that Prisma generated from our schema.
//
// This client already knows about all our tables (User, Session, Review,
// ReviewResult) and provides methods like:
// prisma.user.create()
// prisma.review.findMany()
// prisma.reviewResult.create()
// etc.
//
// We are importing the generated client directly because our Prisma
// schema uses the newer Prisma 7 generated-client setup.
import { PrismaClient } from "../generated/prisma/client.ts";


// Prisma 7 with PostgreSQL uses a database adapter.
//
// PrismaPg connects Prisma Client to our PostgreSQL database using
// the PostgreSQL driver (pg).
//
// We installed this package with:
// npm install @prisma/adapter-pg pg
import { PrismaPg } from "@prisma/adapter-pg";


// globalThis is a built-in JavaScript object that is shared across
// the entire Node.js process.
//
// We use it to store our PrismaClient instance so that the same
// PrismaClient can be reused instead of creating a new one every time
// this file is loaded.
const globalForPrisma = globalThis;


// Create the PostgreSQL adapter.
//
// The adapter needs our PostgreSQL database connection string.
// DATABASE_URL comes from our .env file and is loaded above by
// "dotenv/config".
//
// The adapter is required by our Prisma 7 setup because PrismaClient
// needs to know which database driver it should use.
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});


// Create our PrismaClient.
//
// If a PrismaClient already exists on globalThis, reuse that instance.
//
// Otherwise, create a new PrismaClient and provide the PostgreSQL
// adapter to it.
//
// Why do we reuse the existing instance?
//
// In Next.js development mode, files can be reloaded frequently.
// Creating a new PrismaClient every time could create multiple
// database connections and eventually cause connection problems.
//
// This pattern is called a "Singleton" because one shared
// PrismaClient instance is reused throughout the application.
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });


// In development, Next.js can reload files whenever we save changes.
//
// Without storing PrismaClient on globalThis, every reload could
// create another PrismaClient and another set of database connections.
//
// Therefore, we store our PrismaClient on globalThis so that future
// reloads can reuse the same instance.
//
// We don't need this in production because the production server
// normally does not perform Next.js hot module reloading.
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}