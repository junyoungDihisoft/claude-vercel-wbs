import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Supabase Transaction pooler 호환을 위해 prepared statement 비활성화.
// (CLAUDE.md §5 — 런타임은 Transaction pooler 6543을 쓴다.)
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client);
