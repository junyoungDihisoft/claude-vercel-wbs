import { expect, type Page } from '@playwright/test';

/**
 * Chakra v3 Dialog (Zag.js)는 닫힐 때 body 의 scroll-lock 인라인 스타일
 * (overflow: hidden; pointer-events: none;) 과 body 직속 형제 노드의
 * aria-hidden=true 를 깨끗이 정리하지 못하는 경우가 있다.
 *
 * TODO(#30): Chakra Dialog scroll-lock 잔재가 lifecycle 측에서 해결되면
 * 본 헬퍼는 단순 `expect(...).toHaveCount(0)` 으로 단순화 후 삭제한다.
 * (이슈 #30 수용 기준 3 참고.)
 *
 * aria-hidden 제거 범위는 의도적으로 body 직속 형제로 좁힌다. Tooltip/
 * Popover 등 깊은 트리 안의 aria-hidden=true 는 의도된 inert 일 수 있어
 * 훼손하면 안 된다.
 */
export async function waitForDialogClosed(page: Page) {
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await page.evaluate(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.querySelectorAll('body > [aria-hidden="true"]').forEach((el) => {
      if (!el.querySelector('[role="dialog"], [role="alertdialog"]')) {
        el.removeAttribute('aria-hidden');
      }
    });
  });
}
