// Import the PrismaClient that Prisma generated from our schema.
// This client already knows about all our tables (User, Session, Review, ReviewResult)
// and provides methods like prisma.user.create(), prisma.review.findMany(), etc.

import {PrismaClient} from "../generated/prisma";

// globalThis is not made for Prisma. It is a built-in JavaScript object where you can store anything that should be shared across the entire Node.js application. We're simply using it to store the PrismaClient because Next.js development mode reloads files frequently, and we don't want to create a new database connection every time.
// globalThis is a global object shared across the entire Node.js process.
// We use it to store a single PrismaClient instance.
// This prevents creating multiple database connections during Next.js hot reload. 
const globalForPrisma = globalThis;



// If a PrismaClient already exists on globalThis, reuse it.
// Otherwise, create a new PrismaClient.
//
// Why?
// Creating a new PrismaClient for every API request or every file reload
// would open multiple database connections and eventually cause connection errors.
//
// This pattern is called a "Singleton" because only one PrismaClient
// instance is shared throughout the application.

export const prisma = 
    globalForPrisma.prisma || new PrismaClient();

// In development, Next.js reloads files automatically whenever we save changes.
// Without this, every reload would create a new PrismaClient.
//
// So we store the existing PrismaClient inside globalThis,
// allowing future reloads to reuse the same instance.
//
// In production, this is not needed because the server doesn't hot reload.

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}