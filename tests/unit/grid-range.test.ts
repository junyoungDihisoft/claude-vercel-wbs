import { describe, it, expect } from 'vitest';
import { computeGridRange } from '@/lib/gantt/grid-range';

describe('computeGridRange', () => {
  it('작업 0건 → 오늘 -14d / +28d를 주 단위로 정규화', () => {
    const today = new Date('2026-05-15T00:00:00Z');
    const r = computeGridRange([], today);
    expect(r.rangeStartIso).toBe('2026-04-26');
    expect(r.end.toISOString().slice(0, 10)).toBe('2026-06-07');
    expect(r.weeks).toHaveLength(6);
    expect(r.totalDays).toBe(42);
  });

  it('작업 1건 → 오늘과 작업 날짜 중 min은 -7d, max는 +14d 패딩', () => {
    const today = new Date('2026-05-15T00:00:00Z');
    const r = computeGridRange(
      [{ startDate: '2026-05-04', dueDate: '2026-05-08' }],
      today
    );
    expect(r.rangeStartIso).toBe('2026-04-26');
    expect(r.end.toISOString().slice(0, 10)).toBe('2026-05-24');
    expect(r.weeks.map((w) => w.toISOString().slice(0, 10))).toEqual([
      '2026-04-26',
      '2026-05-03',
      '2026-05-10',
      '2026-05-17',
    ]);
    expect(r.months.map((m) => ({ label: m.label, weeks: m.weeks }))).toEqual([
      { label: '2026년 4월', weeks: 1 },
      { label: '2026년 5월', weeks: 3 },
    ]);
  });

  it('startDate만 있고 dueDate는 비어 있는 작업도 dates에 포함', () => {
    const today = new Date('2026-05-15T00:00:00Z');
    const r = computeGridRange(
      [{ startDate: '2026-04-01', dueDate: null }],
      today
    );
    expect(r.weeks[0].toISOString().slice(0, 10)).toBe('2026-03-22');
  });
});
