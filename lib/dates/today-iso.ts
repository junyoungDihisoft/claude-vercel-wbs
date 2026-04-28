/**
 * 앱 기준 타임존. 현재 MVP는 단일 사용자 가정이므로 한국 시각 자정을
 * "오늘"의 경계로 본다. 다중 사용자 도입 시 사용자 prefs로 옮긴다.
 */
export const APP_TZ = 'Asia/Seoul';

/**
 * APP_TZ 기준 오늘 날짜를 'YYYY-MM-DD' 문자열로 돌려준다.
 * Server Component에서 한 번 산출해 Client Component prop으로 내려보내는 용도.
 * (`new Intl.DateTimeFormat('en-CA', ...)`는 'YYYY-MM-DD' 포맷을 보장한다.)
 */
export function getTodayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TZ }).format(now);
}
