import { describe, it, expect } from 'vitest';
import { computeBarStyle } from '@/lib/gantt/compute-bar-style';

describe('computeBarStyle', () => {
  it('rangeStart과 같은 날 시작하는 7일짜리 막대 → left=0, width=(7-1+1)*dayWidth - 2', () => {
    const result = computeBarStyle(
      { rangeStart: '2026-05-01', dayWidth: 14 },
      { startDate: '2026-05-01', dueDate: '2026-05-07' }
    );
    expect(result).toEqual({ leftPx: 0, widthPx: 96 });
  });

  it('하루짜리(시작=기한)는 한 칸 폭 - 2 만큼 = 12 (최소 너비 클램프와 일치)', () => {
    const result = computeBarStyle(
      { rangeStart: '2026-05-01', dayWidth: 14 },
      { startDate: '2026-05-03', dueDate: '2026-05-03' }
    );
    expect(result).toEqual({ leftPx: 28, widthPx: 12 });
  });

  it('dayWidth가 매우 작아 일수*dayWidth - 2 가 12보다 작으면 12로 클램프', () => {
    const result = computeBarStyle(
      { rangeStart: '2026-05-01', dayWidth: 2 },
      { startDate: '2026-05-01', dueDate: '2026-05-01' }
    );
    expect(result).toEqual({ leftPx: 0, widthPx: 12 });
  });

  it('월 경계 교차 (5/29 ~ 6/5) → width는 일수에 비례', () => {
    const result = computeBarStyle(
      { rangeStart: '2026-05-25', dayWidth: 10 },
      { startDate: '2026-05-29', dueDate: '2026-06-05' }
    );
    expect(result).toEqual({ leftPx: 40, widthPx: 78 });
  });

  it('startDate가 null → null', () => {
    expect(
      computeBarStyle(
        { rangeStart: '2026-05-01', dayWidth: 14 },
        { startDate: null, dueDate: '2026-05-07' }
      )
    ).toBeNull();
  });

  it('dueDate가 null → null', () => {
    expect(
      computeBarStyle(
        { rangeStart: '2026-05-01', dayWidth: 14 },
        { startDate: '2026-05-01', dueDate: null }
      )
    ).toBeNull();
  });

  it('startDate, dueDate 모두 null → null', () => {
    expect(
      computeBarStyle(
        { rangeStart: '2026-05-01', dayWidth: 14 },
        { startDate: null, dueDate: null }
      )
    ).toBeNull();
  });

  it('rangeStart 이전에 시작하는 막대는 left가 음수', () => {
    const result = computeBarStyle(
      { rangeStart: '2026-05-10', dayWidth: 14 },
      { startDate: '2026-05-08', dueDate: '2026-05-12' }
    );
    expect(result).toEqual({ leftPx: -28, widthPx: 68 });
  });
});
