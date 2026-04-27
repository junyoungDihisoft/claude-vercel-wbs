import { describe, it, expect } from 'vitest';
import { deriveStatusFromProgress } from '@/lib/tasks/derive-status';

describe('deriveStatusFromProgress', () => {
  it('100 미만이면 현재 상태 유지 (todo)', () => {
    expect(deriveStatusFromProgress(99, 'todo')).toBe('todo');
  });

  it('100 미만이면 현재 상태 유지 (doing)', () => {
    expect(deriveStatusFromProgress(99, 'doing')).toBe('doing');
  });

  it('100 이면 done 으로 강제', () => {
    expect(deriveStatusFromProgress(100, 'todo')).toBe('done');
  });

  it('100 이면 done 으로 강제 (doing)', () => {
    expect(deriveStatusFromProgress(100, 'doing')).toBe('done');
  });

  it('이미 done 이고 100 이면 done 유지 (멱등)', () => {
    expect(deriveStatusFromProgress(100, 'done')).toBe('done');
  });

  it('0 이어도 done 은 유지 — 역방향 동기화 없음', () => {
    expect(deriveStatusFromProgress(0, 'done')).toBe('done');
  });

  it('80 이어도 done 은 유지 — 역방향 동기화 없음', () => {
    expect(deriveStatusFromProgress(80, 'done')).toBe('done');
  });
});
