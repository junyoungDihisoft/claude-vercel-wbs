import Papa from 'papaparse';
import type { ParsedCsv, ParsedRow, Skipped, Warning } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_KO_MAP: Record<string, 'todo' | 'doing' | 'done'> = {
  '할 일': 'todo',
  '진행 중': 'doing',
  완료: 'done',
  todo: 'todo',
  doing: 'doing',
  done: 'done',
};

export function parseCsv(text: string, existingTitles: Set<string>): ParsedCsv {
  const parsed = Papa.parse<string[]>(text.trim(), {
    skipEmptyLines: true,
  });

  const allData = parsed.data as string[][];
  if (allData.length < 2) {
    return { rows: [], skipped: [], warnings: [] };
  }

  const dataRows = allData.slice(1); // skip header

  // 1패스: CSV 내부 제목 셋 구성 (부모 매칭용)
  const csvTitles = new Set<string>(
    dataRows.map((r) => r[0]?.trim()).filter(Boolean),
  );
  const allKnownTitles = new Set([...existingTitles, ...csvTitles]);

  const rows: ParsedRow[] = [];
  const skipped: Skipped[] = [];
  const warnings: Warning[] = [];

  // 2패스: 행별 검증
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowIndex = i + 1; // 1-based

    const rawTitle = row[0]?.trim() ?? '';
    if (!rawTitle) {
      skipped.push({ rowIndex, reason: '제목 누락' });
      continue;
    }

    // description
    const description = row[1]?.trim() || null;

    // assignee
    const assignee = row[2]?.trim() || null;

    // status
    const rawStatus = row[3]?.trim() ?? '';
    const status = STATUS_KO_MAP[rawStatus];
    let resolvedStatus: 'todo' | 'doing' | 'done';
    if (status !== undefined) {
      resolvedStatus = status;
    } else {
      resolvedStatus = 'todo';
      warnings.push({
        rowIndex,
        field: 'status',
        message: `허용되지 않는 상태값 "${rawStatus}" → "todo" 로 대체`,
      });
    }

    // progress
    const rawProgress = row[4]?.trim() ?? '';
    const progressNum = Number(rawProgress);
    let progress: number;
    if (rawProgress === '' || isNaN(progressNum) || !Number.isFinite(progressNum)) {
      progress = 0;
      if (rawProgress !== '') {
        warnings.push({
          rowIndex,
          field: 'progress',
          message: `숫자가 아닌 진행률 "${rawProgress}" → 0 으로 처리`,
        });
      }
    } else if (progressNum < 0 || progressNum > 100) {
      progress = Math.max(0, Math.min(100, progressNum));
      warnings.push({
        rowIndex,
        field: 'progress',
        message: `진행률 범위 초과(${rawProgress}) → ${progress} 으로 조정`,
      });
    } else {
      progress = Math.round(progressNum);
    }

    // startDate
    const rawStart = row[5]?.trim() ?? '';
    let startDate: string | null = null;
    if (rawStart) {
      if (DATE_RE.test(rawStart)) {
        startDate = rawStart;
      } else {
        warnings.push({
          rowIndex,
          field: 'startDate',
          message: `날짜 형식 불량 "${rawStart}" → 비움`,
        });
      }
    }

    // dueDate
    const rawDue = row[6]?.trim() ?? '';
    let dueDate: string | null = null;
    if (rawDue) {
      if (DATE_RE.test(rawDue)) {
        dueDate = rawDue;
      } else {
        warnings.push({
          rowIndex,
          field: 'dueDate',
          message: `날짜 형식 불량 "${rawDue}" → 비움`,
        });
      }
    }

    // parentTitle
    const rawParent = row[7]?.trim() ?? '';
    let parentTitle: string | null = null;
    if (rawParent) {
      if (allKnownTitles.has(rawParent) && rawParent !== rawTitle) {
        parentTitle = rawParent;
      } else {
        warnings.push({
          rowIndex,
          field: 'parentTitle',
          message: `상위 작업 "${rawParent}" 매칭 실패 → 최상위로 처리`,
        });
      }
    }

    rows.push({
      title: rawTitle,
      description,
      assignee,
      status: resolvedStatus,
      progress,
      startDate,
      dueDate,
      parentTitle,
    });
  }

  return { rows, skipped, warnings };
}
