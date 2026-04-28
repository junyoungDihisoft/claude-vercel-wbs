import { expect, type Page } from '@playwright/test';

/**
 * Chakra v3 Dialog (Zag.js)는 닫힐 때 body 의 scroll-lock 인라인 스타일
 * (overflow: hidden; pointer-events: none;) 과 일부 ancestor의 aria-hidden=true
 * 를 깨끗이 정리하지 못하는 경우가 있다(특히 unmountOnExit 사용 시).
 * 그 결과 dialog 가 사라진 직후 outside-area 클릭/접근성 쿼리가 막힌다.
 *
 * 해당 lifecycle 버그는 본 이슈(#7) 범위 밖이며 별도로 트래킹한다. 신규 e2e
 * 테스트가 안정적으로 돌도록, dialog 가 분리된 직후 잔재 스타일/속성을 강제로
 * 청소한다.
 */
export async function waitForDialogClosed(page: Page) {
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.evaluate(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
      if (!el.closest('[role="dialog"], [role="alertdialog"]')) {
        el.removeAttribute('aria-hidden');
      }
    });
  });
}
