import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';
import { isoDateOffset } from './_helpers/dates';

test.describe('J9 — 목록 뷰 overdue 시각 표시', () => {
  test('기한 지난 미완료 작업에 overdue 표시 → 완료 전환 시 즉시 해제', async ({ page }) => {
    await page.goto('/');

    const taskTitle = `J9 기한초과 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.locator('input[type="date"]').nth(0).fill(isoDateOffset(-7));
    await page.locator('input[type="date"]').nth(1).fill(isoDateOffset(-3));
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    await expect(page.getByText(taskTitle)).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: taskTitle });

    // overdue 클래스 및 배지 확인
    await expect(row.locator('.daterange.has-due-overdue')).toBeVisible();
    await expect(row.locator('.overdue-badge')).toBeVisible();
    await expect(row.locator('.overdue-badge')).toHaveText('지남');

    // 상태 배지 두 번 클릭 → 완료
    await row.getByRole('button', { name: '할 일' }).click();
    await expect(row.getByText('진행 중')).toBeVisible();
    await row.getByRole('button', { name: '진행 중' }).click();
    await expect(row.getByText('완료')).toBeVisible();

    // overdue 표시 해제 확인
    await expect(row.locator('.daterange.has-due-overdue')).toHaveCount(0);
    await expect(row.locator('.overdue-badge')).toHaveCount(0);
  });
});
