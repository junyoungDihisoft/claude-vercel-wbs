import { describe, it, expect } from 'vitest';
import { buildCsv } from '@/lib/csv/build';
import type { TaskNode } from '@/lib/tree/build-task-tree';
import type { Task } from '@/lib/types';

const BOM = '﻿';
const HEADER = '제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목';

function makeTask(overrides: Partial<Task> & { id: string; title: string }): Task {
  return {
    parentId: null,
    description: null,
    assignee: null,
    status: 'todo',
    progress: 0,
    startDate: null,
    dueDate: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function dataLines(csv: string): string[] {
  return csv
    .slice(BOM.length)
    .split('\n')
    .map((l) => l.trimEnd()) // papaparse 는 CRLF 출력 — \r 제거
    .filter((l) => l !== '');
}

describe('buildCsv', () => {
  it('출력이 BOM 으로 시작함', () => {
    const nodes: TaskNode[] = [{ task: makeTask({ id: 'p', title: '루트' }), depth: 0, hasChildren: false }];
    expect(buildCsv(nodes).startsWith(BOM)).toBe(true);
  });

  it('첫 줄이 정확한 한글 헤더 (공백 없음)', () => {
    const nodes: TaskNode[] = [{ task: makeTask({ id: 'p', title: '루트' }), depth: 0, hasChildren: false }];
    const lines = dataLines(buildCsv(nodes));
    expect(lines[0]).toBe(HEADER);
  });

  it('빈 nodes → 헤더만 출력', () => {
    const lines = dataLines(buildCsv([]));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(HEADER);
  });

  it('부모 1 + 자식 2 → 헤더 포함 4줄', () => {
    const parent = makeTask({ id: 'p', title: '부모' });
    const child1 = makeTask({ id: 'c1', title: '자식1', parentId: 'p' });
    const child2 = makeTask({ id: 'c2', title: '자식2', parentId: 'p' });
    const nodes: TaskNode[] = [
      { task: parent, depth: 0, hasChildren: true },
      { task: child1, depth: 1, hasChildren: false },
      { task: child2, depth: 1, hasChildren: false },
    ];
    expect(dataLines(buildCsv(nodes))).toHaveLength(4);
  });

  it('자식 행의 8번째 셀(상위 작업 제목)이 부모 제목', () => {
    const parent = makeTask({ id: 'p', title: '킥오프 미팅' });
    const child = makeTask({ id: 'c', title: '아젠다 초안', parentId: 'p' });
    const nodes: TaskNode[] = [
      { task: parent, depth: 0, hasChildren: true },
      { task: child, depth: 1, hasChildren: false },
    ];
    const lines = dataLines(buildCsv(nodes));
    // child: 세 번째 줄(index 2) = 헤더+부모+자식
    const childCells = lines[2].split(',');
    expect(childCells[7]).toBe('킥오프 미팅');
  });

  it('최상위 작업의 상위 작업 제목 셀은 빈 문자열', () => {
    const parent = makeTask({ id: 'p', title: '루트' });
    const nodes: TaskNode[] = [{ task: parent, depth: 0, hasChildren: false }];
    const lines = dataLines(buildCsv(nodes));
    const cells = lines[1].split(',');
    expect(cells[7]).toBe('');
  });

  it('셀에 쉼표가 포함되면 따옴표로 감쌈', () => {
    const task = makeTask({ id: 't', title: '기획, 설계' });
    const nodes: TaskNode[] = [{ task, depth: 0, hasChildren: false }];
    expect(buildCsv(nodes)).toContain('"기획, 설계"');
  });

  it('status → 한국어로 변환 출력', () => {
    const nodes: TaskNode[] = [
      { task: makeTask({ id: 't1', title: '작업1', status: 'todo' }), depth: 0, hasChildren: false },
      { task: makeTask({ id: 't2', title: '작업2', status: 'doing' }), depth: 0, hasChildren: false },
      { task: makeTask({ id: 't3', title: '작업3', status: 'done' }), depth: 0, hasChildren: false },
    ];
    const csv = buildCsv(nodes);
    expect(csv).toContain('할 일');
    expect(csv).toContain('진행 중');
    expect(csv).toContain('완료');
  });

  it('날짜·진행률이 올바른 셀에 출력됨', () => {
    const task = makeTask({
      id: 't',
      title: '작업',
      progress: 60,
      startDate: '2026-05-01',
      dueDate: '2026-05-10',
    });
    const nodes: TaskNode[] = [{ task, depth: 0, hasChildren: false }];
    const lines = dataLines(buildCsv(nodes));
    const cells = lines[1].split(',');
    expect(cells[4]).toBe('60');       // 진행률 (5번째 열, 0-index: 4)
    expect(cells[5]).toBe('2026-05-01'); // 시작일
    expect(cells[6]).toBe('2026-05-10'); // 목표 기한
  });
});
