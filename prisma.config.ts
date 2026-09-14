import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Not set during `prisma generate` in the Docker build, which doesn't need it
    url: process.env.DATABASE_URL,
  },
})
