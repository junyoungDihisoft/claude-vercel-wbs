import { test, expect } from '@playwright/test';

test.describe('J14 — 간트 막대의 진행률 채움', () => {
  test('진행률 60% → 막대 fill width: 60%, 30%로 변경 후 재진입 시 30%', async ({
    page,
  }) => {
    await page.goto('/');

    const taskTitle = `J14 진행률 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.getByLabel('시작일').fill('2026-05-01');
    await page.getByLabel('목표 기한').fill('2026-05-10');
    await page.getByRole('spinbutton').first().fill('60');
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 간트 진입
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);

    // 해당 작업 행의 fill width: 60%
    const row = page.locator('.gantt-grid-row').filter({ has: page.locator('.gantt-bar') }).first();
    const fill = row.locator('.gantt-bar-fill');
    await expect(fill).toBeVisible();
    await expect(fill).toHaveAttribute('style', /width:\s*60%/);

    // 목록 뷰로 돌아가 진행률 30 변경
    await page.getByRole('link', { name: '목록' }).click();
    await expect(page).toHaveURL(/\/$/);
    const taskRow = page.getByRole('row').filter({ hasText: taskTitle });
    await taskRow.getByRole('button', { name: '편집' }).click();
    await page.getByRole('spinbutton').first().fill('30');
    await page.getByRole('button', { name: '수정' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 간트 재진입 → fill width: 30%
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);
    const fill2 = page.locator('.gantt-bar-fill').first();
    await expect(fill2).toHaveAttribute('style', /width:\s*30%/);
  });
});
