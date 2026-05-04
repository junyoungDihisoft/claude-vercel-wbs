import type { Task } from '@/lib/types';
import { isOverdue } from '@/lib/tasks/is-overdue';

export type TaskStats = {
  total: number;
  doneCount: number;
  doingCount: number;
  overdueCount: number;
  donePercent: number; // 0~100 정수
};

export function computeStats(tasks: Task[], todayIso: string): TaskStats {
  const acc = tasks.reduce(
    (s, t) => {
      s.total += 1;
      if (t.status === 'done') s.doneCount += 1;
      if (t.status === 'doing') s.doingCount += 1;
      if (isOverdue({ dueDate: t.dueDate, status: t.status }, todayIso)) s.overdueCount += 1;
      return s;
    },
    { total: 0, doneCount: 0, doingCount: 0, overdueCount: 0 },
  );

  const donePercent = acc.total === 0 ? 0 : Math.round((acc.doneCount / acc.total) * 100);

  return { ...acc, donePercent };
}
