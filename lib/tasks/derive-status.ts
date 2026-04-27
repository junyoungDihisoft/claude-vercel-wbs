import type { TaskStatus } from '@/lib/types';

export function deriveStatusFromProgress(
  progress: number,
  currentStatus: TaskStatus,
): TaskStatus {
  if (progress === 100) return 'done';
  return currentStatus;
}
