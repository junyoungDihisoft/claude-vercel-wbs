import type { Task } from '@/lib/types';

// 'YYYY-MM-DD' 문자열은 사전순 = 시간순이므로 Date 변환 없이 strict < 비교만으로 충분하다.
export function isOverdue(
  task: Pick<Task, 'dueDate' | 'status'>,
  todayIso: string,
): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'done') return false;
  return task.dueDate < todayIso;
}
