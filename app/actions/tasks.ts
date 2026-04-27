'use server';

import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deriveStatusFromProgress } from '@/lib/tasks/derive-status';
import type { TaskStatus } from '@/lib/types';

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

const STATUS_VALUES = ['todo', 'doing', 'done'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(data: TaskFormData): string | null {
  const title = data.title?.trim() ?? '';
  if (title.length === 0) return '제목을 입력해 주세요.';
  if (title.length > 200) return '제목은 200자 이내로 입력해 주세요.';

  if (data.description && data.description.length > 2000)
    return '설명은 2000자 이내로 입력해 주세요.';
  if (data.assignee && data.assignee.length > 100)
    return '담당자는 100자 이내로 입력해 주세요.';

  if (data.status !== undefined && !STATUS_VALUES.includes(data.status))
    return '유효하지 않은 상태 값입니다.';

  if (data.progress !== undefined) {
    if (!Number.isInteger(data.progress) || data.progress < 0 || data.progress > 100)
      return '진행률은 0~100 사이의 정수여야 합니다.';
  }

  if (data.startDate && !DATE_RE.test(data.startDate))
    return '시작일 형식이 올바르지 않습니다.';
  if (data.dueDate && !DATE_RE.test(data.dueDate))
    return '목표 기한 형식이 올바르지 않습니다.';
  if (data.startDate && data.dueDate && data.startDate > data.dueDate)
    return '목표 기한은 시작일 이후여야 합니다.';

  if (data.parentId && !UUID_RE.test(data.parentId))
    return '상위 작업 ID가 올바르지 않습니다.';

  return null;
}

export async function createTask(data: TaskFormData): Promise<ActionResult> {
  const err = validate(data);
  if (err) return { success: false, error: err };
  const db = getDb();
  if (data.parentId) {
    const parent = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.id, data.parentId))
      .limit(1);
    if (parent.length === 0)
      return { success: false, error: '상위 작업을 찾을 수 없습니다.' };
  }
  try {
    const progress = data.progress ?? 0;
    const status = deriveStatusFromProgress(progress, (data.status ?? 'todo') as TaskStatus);
    await db.insert(tasks).values({
      title: data.title.trim(),
      description: data.description ?? null,
      assignee: data.assignee ?? null,
      status,
      progress,
      startDate: data.startDate ?? null,
      dueDate: data.dueDate ?? null,
      parentId: data.parentId ?? null,
    });
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[createTask] failed', { msg: (err as Error).message });
    return { success: false, error: '작업 생성에 실패했습니다.' };
  }
}

export async function updateTask(
  id: string,
  data: TaskFormData,
): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: '작업 ID가 올바르지 않습니다.' };
  const err = validate(data);
  if (err) return { success: false, error: err };
  try {
    const db = getDb();
    const progress = data.progress ?? 0;
    const status = deriveStatusFromProgress(progress, (data.status ?? 'todo') as TaskStatus);
    await db
      .update(tasks)
      .set({
        title: data.title.trim(),
        description: data.description ?? null,
        assignee: data.assignee ?? null,
        status,
        progress,
        startDate: data.startDate ?? null,
        dueDate: data.dueDate ?? null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id));
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[updateTask] failed', { msg: (err as Error).message });
    return { success: false, error: '작업 수정에 실패했습니다.' };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: '작업 ID가 올바르지 않습니다.' };
  try {
    const db = getDb();
    await db.delete(tasks).where(eq(tasks.id, id));
    // revalidatePath 를 생략하고 클라이언트에서 router.refresh() 로 대체한다.
    // 이유: revalidatePath 가 즉시 DOM을 갱신하면 다이얼로그 focus-trap 정리 전에
    // 트리거 요소(삭제 버튼)가 사라져 "@zag-js/focus-trap" 에러가 발생한다.
    return { success: true };
  } catch (err) {
    console.error('[deleteTask] failed', { msg: (err as Error).message });
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

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'doing',
  doing: 'done',
  done: 'todo',
};

// 상태 배지 인라인 순환 전환 — 진행률은 건드리지 않는다 (역방향 동기화 금지)
export async function cycleTaskStatus(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { success: false, error: '작업 ID가 올바르지 않습니다.' };
  try {
    const db = getDb();
    const [row] = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    if (!row) return { success: false, error: '작업을 찾을 수 없습니다.' };
    const next = STATUS_CYCLE[row.status as TaskStatus] ?? 'todo';
    await db
      .update(tasks)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(tasks.id, id));
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[cycleTaskStatus] failed', { msg: (err as Error).message });
    return { success: false, error: '상태 변경에 실패했습니다.' };
  }
}
