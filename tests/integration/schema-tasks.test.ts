// @vitest-environment node
//
// 이 파일은 실제 로컬 Postgres(Supabase 컨테이너)를 친다.
// 실행 전 사전조건:
//   1) `supabase start`
//   2) `npm run db:migrate` (이슈 #2 GREEN 슬라이스 이후)
//   3) `.env.local` 의 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
// 실행: `npm run test:db`. 기본 `npm test` 는 vitest.config.ts 의 exclude 로 이 파일을 건너뜀.

import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';

// .env.local 의 DATABASE_URL 을 process.env 에 주입 (이미 export 돼 있으면 그대로).
// dotenv 의존을 피하기 위한 5줄짜리 로더.
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // 파일 없음 → 사용자가 직접 export 했다고 가정. getDb() 가 친절한 에러를 던짐.
  }
}

import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';

type Db = ReturnType<typeof getDb>;
let db: Db;

beforeAll(async () => {
  db = getDb();
  await db.execute(sql`select 1`);
});

beforeEach(async () => {
  await db.execute(sql`delete from ${tasks}`);
});

afterAll(async () => {
  await db.execute(sql`delete from ${tasks}`);
});

describe('Issue #2 — tasks 스키마 / Drizzle round-trip', () => {
  it('title 만 넣어 insert 하면 row 가 select 되고 기본값이 채워진다', async () => {
    const [inserted] = await db
      .insert(tasks)
      .values({ title: '기획 회의' })
      .returning();

    expect(inserted.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(inserted.title).toBe('기획 회의');
    expect(inserted.status).toBe('todo');
    expect(inserted.progress).toBe(0);
    expect(inserted.createdAt).toBeInstanceOf(Date);
    expect(inserted.updatedAt).toBeInstanceOf(Date);
    expect(inserted.parentId).toBeNull();
    expect(inserted.description).toBeNull();
    expect(inserted.assignee).toBeNull();
    expect(inserted.startDate).toBeNull();
    expect(inserted.dueDate).toBeNull();

    const rows = await db.select().from(tasks);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(inserted.id);
  });

  it('title 없이 insert 하면 DB 가 거부한다 (notNull)', async () => {
    await expect(
      db.execute(sql`insert into ${tasks} (description) values ('제목 없음')`),
    ).rejects.toThrow();
  });

  it('부모 삭제 시 자식 행도 cascade 로 함께 사라진다', async () => {
    const [parent] = await db
      .insert(tasks)
      .values({ title: '부모' })
      .returning();
    const [child] = await db
      .insert(tasks)
      .values({ title: '자식', parentId: parent.id })
      .returning();

    expect(child.parentId).toBe(parent.id);

    await db.execute(sql`delete from ${tasks} where id = ${parent.id}`);

    const rows = await db.select().from(tasks);
    expect(rows).toHaveLength(0);
  });
});

describe('Issue #2 — check constraints', () => {
  it('progress = 101 은 거부된다', async () => {
    await expect(
      db.insert(tasks).values({ title: '범위초과', progress: 101 }),
    ).rejects.toThrow();
  });

  it("status = 'unknown' 은 거부된다", async () => {
    await expect(
      db
        .insert(tasks)
        .values({ title: '잘못된상태', status: 'unknown' as 'todo' }),
    ).rejects.toThrow();
  });
});
