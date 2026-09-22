import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as financeSchema from './schema'
import { appSchema } from './app-schema'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const schema = { ...financeSchema, ...appSchema }
export const db = drizzle(pool, { schema })
