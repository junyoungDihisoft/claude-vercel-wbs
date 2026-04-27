import { test, expect } from '@playwright/test';

test.describe('J17 — 시작일 > 목표 기한 검증', () => {
  test('시작일이 목표 기한보다 늦으면 에러 메시지가 표시되고 저장이 되지 않는다', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByPlaceholder('작업 제목').fill('날짜 검증 테스트');
    await page.locator('input[type="date"]').nth(0).fill('2025-12-31');
    await page.locator('input[type="date"]').nth(1).fill('2025-01-01');

    await page.getByRole('button', { name: '추가' }).click();

    // 에러 메시지 표시
    await expect(
      page.getByText('목표 기한은 시작일 이후여야 합니다.').first(),
    ).toBeVisible();
    // 다이얼로그는 닫히지 않는다
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('시작일과 목표 기한이 동일하면 저장된다', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    const taskTitle = `J17 동일 날짜 ${Date.now()}`;
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.locator('input[type="date"]').nth(0).fill('2025-06-01');
    await page.locator('input[type="date"]').nth(1).fill('2025-06-01');

    await page.getByRole('button', { name: '추가' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();
  });
});
