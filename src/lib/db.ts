import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Prisma 5's native engine stored DateTime as epoch milliseconds. The adapter
  // defaults to ISO strings, which would mix text and integers in the same
  // column and break ordering (SQLite sorts all text after all numbers).
  const adapter = new PrismaBetterSqlite3(
    { url: process.env.DATABASE_URL! },
    { timestampFormat: 'unixepoch-ms' }
  )
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
