import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type DbClient = ReturnType<typeof drizzle>;

let cached: DbClient | null = null;

// Supabase Transaction pooler(6543) 호환을 위해 prepare:false (CLAUDE.md §5).
// 커넥션은 첫 호출 시점에 lazy-create — import 단계에서는 DATABASE_URL 을 요구하지 않는다.
export function getDb(): DbClient {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. .env.local 을 supabase status 출력으로 채워주세요.',
    );
  }
  cached = drizzle(postgres(url, { prepare: false }));
  return cached;
}
