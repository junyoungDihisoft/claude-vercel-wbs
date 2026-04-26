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
    // 사용자-facing 에러는 generic 으로. 로컬 파일 경로(.env.local) 같은
    // 환경 힌트는 README/CLAUDE.md 로 분리한다 (정보 노출 최소화).
    throw new Error('DATABASE_URL is not configured');
  }
  cached = drizzle(postgres(url, { prepare: false }));
  return cached;
}
