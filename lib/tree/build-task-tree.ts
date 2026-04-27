import type { Task } from '@/lib/types';

export type TaskNode = {
  task: Task;
  depth: number;
  hasChildren: boolean;
};

export function buildTaskTree(tasks: Task[]): TaskNode[] {
  const idSet = new Set(tasks.map((t) => t.id));

  // parent_id가 셋에 없으면 고아 → 루트로 처리
  const childrenMap = new Map<string | null, Task[]>();
  for (const task of tasks) {
    const key = task.parentId && idSet.has(task.parentId) ? task.parentId : null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(task);
  }

  // 형제 정렬: createdAt 오름차순
  for (const siblings of childrenMap.values()) {
    siblings.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const result: TaskNode[] = [];

  // DFS. visited로 사이클 방어
  function dfs(parentId: string | null, depth: number, visited: Set<string>) {
    const children = childrenMap.get(parentId) ?? [];
    for (const task of children) {
      if (visited.has(task.id)) continue;
      visited.add(task.id);
      const hasChildren = (childrenMap.get(task.id)?.length ?? 0) > 0;
      result.push({ task, depth, hasChildren });
      dfs(task.id, depth + 1, visited);
    }
  }

  dfs(null, 0, new Set());
  return result;
}
