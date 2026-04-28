import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';
import { isoDateOffset } from './_helpers/dates';

test.describe('J13 — 간트 뷰로 전환', () => {
  test('토글에서 "간트" 클릭 시 /gantt 라우트, 좌측 트리·우측 그리드·오늘 강조선·"일정 없음" 표기', async ({
    page,
  }) => {
    await page.goto('/');

    // 시작일/기한 모두 있는 작업 (오늘 +6d ~ +10d — `computeGridRange` 윈도우 안)
    const tsScheduled = `J13 일정있음 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(tsScheduled);
    await page.locator('input[type="date"]').nth(0).fill(isoDateOffset(6));
    await page.locator('input[type="date"]').nth(1).fill(isoDateOffset(10));
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    await expect(page.getByText(tsScheduled)).toBeVisible();

    // 일정 없는 작업
    const tsNoDates = `J13 일정없음 ${Date.now() + 1}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(tsNoDates);
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    await expect(page.getByText(tsNoDates)).toBeVisible();

    // 토글 → 간트
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);

    // 토글 active 상태가 'aria-current=page' 로 노출됨 (a11y 계약)
    await expect(page.getByRole('link', { name: '간트' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('link', { name: '목록' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );

    // 좌측 트리: 두 작업의 제목이 좌측 영역에 보임
    await expect(page.getByText(tsScheduled)).toBeVisible();
    await expect(page.getByText(tsNoDates)).toBeVisible();

    // 우측 그리드 + 오늘 세로선
    await expect(page.locator('.gantt-today')).toHaveCount(1);

    // 일정 있는 작업 행에 막대 1개 이상
    await expect(page.locator('.gantt-bar').first()).toBeVisible();

    // 일정 없는 작업 행에 "일정 없음" 표기
    await expect(page.locator('.gantt-empty-bar', { hasText: '일정 없음' }).first()).toBeVisible();
  });
});
