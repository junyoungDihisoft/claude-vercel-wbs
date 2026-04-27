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

  it('사이클(a→b, b→a) — dfs(null) 진입 시 빈 배열로 즉시 종료', () => {
    const a = makeTask({ id: 'a', parentId: 'b' });
    const b = makeTask({ id: 'b', parentId: 'a' });
    const result = buildTaskTree([a, b]);
    expect(result).toHaveLength(0); // 두 노드 모두 루트가 아니므로 출력 없음
  });

  it('자기참조(parentId === 자신 id) — 루트로 승격되지 않아 출력 없음', () => {
    const a = makeTask({ id: 'a', parentId: 'a' });
    const result = buildTaskTree([a]);
    expect(result).toHaveLength(0);
  });

  it('중복 ID 입력 — visited 가드 실행으로 무한 루프 없이 종료', () => {
    // root(parentId=null) → child(parentId='root') → root(parentId='child') 중복 ID
    // dfs가 child의 자식으로 'root'를 방문하려 할 때 visited에 이미 있어 건너뜀
    const root = makeTask({ id: 'root', parentId: null, createdAt: new Date('2026-01-01') });
    const child = makeTask({ id: 'child', parentId: 'root', createdAt: new Date('2026-01-02') });
    const rootAgain = makeTask({ id: 'root', parentId: 'child', createdAt: new Date('2026-01-03') });
    expect(() => buildTaskTree([root, child, rootAgain])).not.toThrow();
    const result = buildTaskTree([root, child, rootAgain]);
    expect(result.map((n) => n.task.id)).toEqual(['root', 'child']);
  });
});
