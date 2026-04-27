'use server';

import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type TaskFormData = {
  title: string;
  description?: string | null;
  assignee?: string | null;
  status?: 'todo' | 'doing' | 'done';
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  parentId?: string | null;
};

export type ActionResult = { success: true } | { success: false; error: string };

export async function createTask(data: TaskFormData): Promise<ActionResult> {
  if (!data.title.trim()) {
    return { success: false, error: '제목을 입력해 주세요.' };
  }
  if (data.startDate && data.dueDate && data.startDate > data.dueDate) {
    return { success: false, error: '목표 기한은 시작일 이후여야 합니다.' };
  }
  try {
    const db = getDb();
    await db.insert(tasks).values({
      title: data.title.trim(),
      description: data.description ?? null,
      assignee: data.assignee ?? null,
      status: data.status ?? 'todo',
      progress: data.progress ?? 0,
      startDate: data.startDate ?? null,
      dueDate: data.dueDate ?? null,
      parentId: data.parentId ?? null,
    });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: '작업 생성에 실패했습니다.' };
  }
}

export async function updateTask(
  id: string,
  data: TaskFormData,
): Promise<ActionResult> {
  if (!data.title.trim()) {
    return { success: false, error: '제목을 입력해 주세요.' };
  }
  if (data.startDate && data.dueDate && data.startDate > data.dueDate) {
    return { success: false, error: '목표 기한은 시작일 이후여야 합니다.' };
  }
  try {
    const db = getDb();
    await db
      .update(tasks)
      .set({
        title: data.title.trim(),
        description: data.description ?? null,
        assignee: data.assignee ?? null,
        status: data.status ?? 'todo',
        progress: data.progress ?? 0,
        startDate: data.startDate ?? null,
        dueDate: data.dueDate ?? null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id));
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: '작업 수정에 실패했습니다.' };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const db = getDb();
    await db.delete(tasks).where(eq(tasks.id, id));
    // revalidatePath 를 생략하고 클라이언트에서 router.refresh() 로 대체한다.
    // 이유: revalidatePath 가 즉시 DOM을 갱신하면 다이얼로그 focus-trap 정리 전에
    // 트리거 요소(삭제 버튼)가 사라져 "@zag-js/focus-trap" 에러가 발생한다.
    return { success: true };
  } catch {
    return { success: false, error: '작업 삭제에 실패했습니다.' };
  }
}

// 삭제 확인 다이얼로그의 동적 문구("하위 작업 N개가…")용
export async function countChildren(parentId: string): Promise<number> {
  const db = getDb();
  const children = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.parentId, parentId));
  return children.length;
}
