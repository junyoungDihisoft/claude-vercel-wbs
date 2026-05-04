import { describe, it, expect } from 'vitest';
import { computeStats } from '@/lib/stats/compute-stats';
import type { Task } from '@/lib/types';

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    parentId: null,
    title: 'task',
    description: null,
    assignee: null,
    status: 'todo',
    progress: 0,
    startDate: null,
    dueDate: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

const TODAY = '2026-05-04';

describe('computeStats', () => {
  it('J18 — 빈 배열 → 모든 카운트 0, donePercent 0', () => {
    expect(computeStats([], TODAY)).toEqual({
      total: 0,
      doneCount: 0,
      doingCount: 0,
      overdueCount: 0,
      donePercent: 0,
    });
  });

  it('J19 — 5건 중 done 2 / doing 1 / todo 2, overdue 없음', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done' }),
      makeTask({ id: '2', status: 'done' }),
      makeTask({ id: '3', status: 'doing' }),
      makeTask({ id: '4', status: 'todo' }),
      makeTask({ id: '5', status: 'todo' }),
    ];
    expect(computeStats(tasks, TODAY)).toEqual({
      total: 5,
      doneCount: 2,
      doingCount: 1,
      overdueCount: 0,
      donePercent: 40,
    });
  });

  it('J20 — 3건 중 1건 overdue (status=doing, dueDate < today)', () => {
    const tasks = [
      makeTask({ id: '1', status: 'doing', dueDate: '2026-04-01' }),
      makeTask({ id: '2', status: 'doing' }),
      makeTask({ id: '3', status: 'todo' }),
    ];
    const result = computeStats(tasks, TODAY);
    expect(result.overdueCount).toBe(1);
  });

  it('overdue 제외 규칙 — dueDate < today 이지만 status=done 은 overdue 미포함', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done', dueDate: '2026-04-01' }),
      makeTask({ id: '2', status: 'todo' }),
    ];
    const result = computeStats(tasks, TODAY);
    expect(result.overdueCount).toBe(0);
  });

  it('donePercent 라운딩 — 3건 중 done 1 → 33', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done' }),
      makeTask({ id: '2', status: 'todo' }),
      makeTask({ id: '3', status: 'todo' }),
    ];
    const result = computeStats(tasks, TODAY);
    expect(result.donePercent).toBe(33);
  });
});
