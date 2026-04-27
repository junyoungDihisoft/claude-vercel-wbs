import Papa from 'papaparse';
import type { TaskNode } from '@/lib/tree/build-task-tree';

const BOM = '﻿';

const HEADERS = ['제목', '설명', '담당자', '상태', '진행률', '시작일', '목표 기한', '상위 작업 제목'];

const STATUS_KO: Record<string, string> = {
  todo: '할 일',
  doing: '진행 중',
  done: '완료',
};

export function buildCsv(nodes: TaskNode[]): string {
  // id → title 역방향 lookup
  const idToTitle = new Map(nodes.map((n) => [n.task.id, n.task.title]));

  const rows: string[][] = nodes.map(({ task }) => [
    task.title,
    task.description ?? '',
    task.assignee ?? '',
    STATUS_KO[task.status] ?? task.status,
    String(task.progress),
    task.startDate ?? '',
    task.dueDate ?? '',
    task.parentId ? (idToTitle.get(task.parentId) ?? '') : '',
  ]);

  const csv = Papa.unparse([HEADERS, ...rows]);
  return BOM + csv;
}
