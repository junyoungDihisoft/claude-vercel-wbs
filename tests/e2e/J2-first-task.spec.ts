import { test, expect } from '@playwright/test';

test.describe('J2 — 첫 최상위 작업 추가', () => {
  test('+ 작업 추가 버튼으로 제목 입력 후 저장하면 목록에 나타난다', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const taskTitle = `J2 테스트 작업 ${Date.now()}`;
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.getByRole('button', { name: '추가' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

  test('제목 없이 저장하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
