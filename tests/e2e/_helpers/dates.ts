/**
 * UTC 기준 N일 후의 'YYYY-MM-DD' 문자열을 반환한다.
 *
 * e2e가 하드코드된 절대 날짜를 쓰면 시간이 흐를수록 `computeGridRange`의
 * 윈도우(오늘 -14d / +28d) 밖으로 떨어져 `.gantt-bar` 가시성 검증이 깨진다.
 * 항상 "오늘 기준 +Nd"로 적어 두면 캘린더가 흘러도 윈도우 안에 머문다.
 */
export function isoDateOffset(days: number, base: Date = new Date()): string {
  const d = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + days),
  );
  return d.toISOString().slice(0, 10);
}
