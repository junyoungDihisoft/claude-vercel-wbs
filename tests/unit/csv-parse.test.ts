import { describe, it, expect } from 'vitest';
import { parseCsv } from '@/lib/csv/parse';

const VALID_CSV = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
리서치,경쟁사 조사,이대리,할 일,0,2026-05-04,2026-05-07,
리서치 요약,,이대리,할 일,0,2026-05-08,2026-05-08,리서치
리뷰 미팅,,김PM,할 일,0,2026-05-10,2026-05-10,`;

describe('parseCsv', () => {
  it('유효 3행 CSV → rows 3개, skipped/warnings 비어 있음', () => {
    const result = parseCsv(VALID_CSV, new Set());
    expect(result.rows).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('첫 번째 row 필드가 정확히 파싱됨', () => {
    const result = parseCsv(VALID_CSV, new Set());
    expect(result.rows[0]).toMatchObject({
      title: '리서치',
      description: '경쟁사 조사',
      assignee: '이대리',
      status: 'todo',
      progress: 0,
      startDate: '2026-05-04',
      dueDate: '2026-05-07',
      parentTitle: null,
    });
  });

  it('CSV 내부 행과 매칭되는 parentTitle 유지', () => {
    const result = parseCsv(VALID_CSV, new Set());
    expect(result.rows[1].parentTitle).toBe('리서치');
  });

  it('제목이 빈 행 → skipped 에 추가(rowIndex 1-based), rows 에서 제외', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
문서화,,김PM,할 일,0,2026-05-11,2026-05-12,
,설명만 있음,,,,,,
QA,,박테스터,할 일,0,2026-05-13,2026-05-14,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toMatchObject({ rowIndex: 2, reason: '제목 누락' });
  });

  it('허용 외 상태값 → todo 로 치환, warnings 에 status 필드 추가', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
긴급작업,,김PM,urgent,0,,,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].status).toBe('todo');
    expect(result.warnings.some((w) => w.rowIndex === 1 && w.field === 'status')).toBe(true);
  });

  it('날짜 형식 불량 → 해당 필드만 null, warnings 에 필드명 추가', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
작업A,,,할 일,0,2026/05/01,2026-05-10,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows[0].startDate).toBeNull();
    expect(result.rows[0].dueDate).toBe('2026-05-10');
    expect(result.warnings.some((w) => w.rowIndex === 1 && w.field === 'startDate')).toBe(true);
  });

  it('상위 매칭 실패 → parentTitle null, warnings 추가, rows 에서 제외 아님', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
QA,,박테스터,할 일,0,2026-05-13,2026-05-14,존재하지않는부모`;
    const result = parseCsv(csv, new Set());
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].parentTitle).toBeNull();
    expect(result.skipped).toHaveLength(0);
    expect(result.warnings.some((w) => w.rowIndex === 1 && w.field === 'parentTitle')).toBe(true);
  });

  it('existingTitles 에 있는 부모 제목은 parentTitle 유지, warnings 없음', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
하위작업,,,할 일,0,,,기존부모`;
    const result = parseCsv(csv, new Set(['기존부모']));
    expect(result.rows[0].parentTitle).toBe('기존부모');
    expect(result.warnings).toHaveLength(0);
  });

  it('진행률이 숫자가 아니면 0, warnings 추가', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
작업A,,,할 일,abc,,,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows[0].progress).toBe(0);
    expect(result.warnings.some((w) => w.rowIndex === 1 && w.field === 'progress')).toBe(true);
  });

  it('진행률 범위 초과(150) → 100 으로 clamp, warnings 추가', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
작업A,,,할 일,150,,,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows[0].progress).toBe(100);
    expect(result.warnings.some((w) => w.rowIndex === 1 && w.field === 'progress')).toBe(true);
  });

  it('한국어 상태값 → 내부 영문값으로 변환', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
작업A,,,진행 중,50,,,
작업B,,,완료,100,,,
작업C,,,할 일,0,,,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows[0].status).toBe('doing');
    expect(result.rows[1].status).toBe('done');
    expect(result.rows[2].status).toBe('todo');
  });

  it('영문 상태값(todo/doing/done)도 그대로 허용', () => {
    const csv = `제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목
작업A,,,todo,0,,,
작업B,,,doing,50,,,
작업C,,,done,100,,,`;
    const result = parseCsv(csv, new Set());
    expect(result.rows[0].status).toBe('todo');
    expect(result.rows[1].status).toBe('doing');
    expect(result.rows[2].status).toBe('done');
    expect(result.warnings).toHaveLength(0);
  });
});
