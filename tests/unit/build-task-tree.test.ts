import { describe, it, expect } from 'vitest';
import { buildTaskTree } from '@/lib/tree/build-task-tree';
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

describe('buildTaskTree', () => {
  it('빈 입력 → 빈 출력', () => {
    expect(buildTaskTree([])).toEqual([]);
  });

  it('단일 루트 → depth 0, hasChildren=false', () => {
    const t = makeTask({ id: 'a' });
    const result = buildTaskTree([t]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ task: t, depth: 0, hasChildren: false });
  });

  it('부모 1 + 자식 1 → DFS 순서, 자식 depth=1, 부모 hasChildren=true', () => {
    const parent = makeTask({ id: 'p', createdAt: new Date('2026-01-01') });
    const child = makeTask({ id: 'c', parentId: 'p', createdAt: new Date('2026-01-02') });
    const result = buildTaskTree([parent, child]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ task: parent, depth: 0, hasChildren: true });
    expect(result[1]).toMatchObject({ task: child, depth: 1, hasChildren: false });
  });

  it('깊이 3 (조부모/부모/자식) → depth 0/1/2 인접 출력', () => {
    const gp = makeTask({ id: 'gp', createdAt: new Date('2026-01-01') });
    const p = makeTask({ id: 'p', parentId: 'gp', createdAt: new Date('2026-01-02') });
    const c = makeTask({ id: 'c', parentId: 'p', createdAt: new Date('2026-01-03') });
    const result = buildTaskTree([gp, p, c]);
    expect(result.map((n) => n.depth)).toEqual([0, 1, 2]);
    expect(result.map((n) => n.task.id)).toEqual(['gp', 'p', 'c']);
  });

  it('형제는 createdAt 오름차순 정렬', () => {
    const parent = makeTask({ id: 'p', createdAt: new Date('2026-01-01') });
    const c1 = makeTask({ id: 'c1', parentId: 'p', createdAt: new Date('2026-01-03') });
    const c2 = makeTask({ id: 'c2', parentId: 'p', createdAt: new Date('2026-01-02') });
    const result = buildTaskTree([parent, c1, c2]);
    expect(result.map((n) => n.task.id)).toEqual(['p', 'c2', 'c1']);
  });

  it('고아(parent_id가 셋에 없음) → 최상위로 표시', () => {
    const orphan = makeTask({ id: 'orphan', parentId: 'nonexistent' });
    const result = buildTaskTree([orphan]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ task: orphan, depth: 0 });
  });

  it('사이클이 있어도 무한 루프 없이 종료', () => {
    const a = makeTask({ id: 'a', parentId: 'b' });
    const b = makeTask({ id: 'b', parentId: 'a' });
    expect(() => buildTaskTree([a, b])).not.toThrow();
  });
});
