'use server';

import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deriveStatusFromProgress } from '@/lib/tasks/derive-status';
import type { ParsedRow } from '@/lib/csv/types';
import type { TaskStatus } from '@/lib/types';

export type ImportResult =
  | { success: true; inserted: number }
  | { success: false; error: string };

export async function importTasksFromCsv(rows: ParsedRow[]): Promise<ImportResult> {
  if (rows.length === 0) return { success: true, inserted: 0 };

  try {
    const db = getDb();

    // 기존 DB의 title → id 맵 구성 (부모 매칭용)
    const existing = await db.select({ id: tasks.id, title: tasks.title }).from(tasks);
    const titleToId = new Map(existing.map((t) => [t.title, t.id]));

    // 1패스: parentTitle 이 없거나 기존 DB에만 있는 행 먼저 insert
    //  → 신규 title → id 를 titleToId 에 추가
    const needsParent: ParsedRow[] = [];

    for (const row of rows) {
      if (row.parentTitle === null || titleToId.has(row.parentTitle)) {
        const parentId = row.parentTitle ? (titleToId.get(row.parentTitle) ?? null) : null;
        const inserted = await insertRow(db, row, parentId);
        titleToId.set(row.title, inserted.id);
      } else {
        needsParent.push(row);
      }
    }

    // 2패스: CSV 내 다른 행이 부모인 경우 (1패스 이후 titleToId 에 있어야 함)
    for (const row of needsParent) {
      const parentId = row.parentTitle ? (titleToId.get(row.parentTitle) ?? null) : null;
      const inserted = await insertRow(db, row, parentId);
      titleToId.set(row.title, inserted.id);
    }

    revalidatePath('/');
    return { success: true, inserted: rows.length };
  } catch (err) {
    console.error('[importTasksFromCsv] failed', { msg: (err as Error).message });
    return { success: false, error: 'CSV 가져오기에 실패했습니다.' };
  }
}

async function insertRow(
  db: ReturnType<typeof import('@/lib/db').getDb>,
  row: ParsedRow,
  parentId: string | null,
) {
  const status = deriveStatusFromProgress(row.progress, row.status as TaskStatus);
  const [inserted] = await db
    .insert(tasks)
    .values({
      title: row.title,
      description: row.description,
      assignee: row.assignee,
      status,
      progress: row.progress,
      startDate: row.startDate,
      dueDate: row.dueDate,
      parentId,
    })
    .returning({ id: tasks.id });
  return inserted;
}
