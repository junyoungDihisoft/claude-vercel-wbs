import { describe, it, expect } from 'vitest';
import { isOverdue } from '@/lib/tasks/is-overdue';

describe('isOverdue', () => {
  const today = '2026-04-29';

  it('dueDate < today + status=doing → true', () => {
    expect(isOverdue({ dueDate: '2026-04-26', status: 'doing' }, today)).toBe(true);
  });

  it('dueDate < today + status=todo → true', () => {
    expect(isOverdue({ dueDate: '2026-04-26', status: 'todo' }, today)).toBe(true);
  });

  it('dueDate < today + status=done → false (완료된 작업은 overdue 아님)', () => {
    expect(isOverdue({ dueDate: '2026-04-26', status: 'done' }, today)).toBe(false);
  });

  it('dueDate === today (경계) → false (strict <)', () => {
    expect(isOverdue({ dueDate: '2026-04-29', status: 'todo' }, today)).toBe(false);
  });

  it('dueDate > today → false', () => {
    expect(isOverdue({ dueDate: '2026-05-10', status: 'todo' }, today)).toBe(false);
  });

  it('dueDate === null → false (기한 없으면 판정 불가)', () => {
    expect(isOverdue({ dueDate: null, status: 'todo' }, today)).toBe(false);
  });
});
