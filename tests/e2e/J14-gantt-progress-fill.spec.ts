import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';
import { isoDateOffset } from './_helpers/dates';

test.describe('J14 — 간트 막대의 진행률 채움', () => {
  test('진행률 60% → 막대 fill width: 60%, 30%로 변경 후 재진입 시 30%', async ({
    page,
  }) => {
    await page.goto('/');

    const taskTitle = `J14 진행률 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.locator('input[type="date"]').nth(0).fill(isoDateOffset(3));
    await page.locator('input[type="date"]').nth(1).fill(isoDateOffset(12));
    await page.getByRole('spinbutton').first().fill('60');
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    await expect(page.getByText(taskTitle)).toBeVisible();

    // 간트 진입
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);

    // 해당 작업 행의 fill width: 60% (제목으로 좌측 행 인덱스 찾고 같은 인덱스의 우측 행 검사)
    const idx = await page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('.gantt-row-left'));
      return rows.findIndex((r) => (r.textContent ?? '').includes(t));
    }, taskTitle);
    expect(idx).toBeGreaterThanOrEqual(0);
    const fill = page.locator('.gantt-grid-row').nth(idx).locator('.gantt-bar-fill');
    await expect(fill).toBeVisible();
    await expect(fill).toHaveAttribute('style', /width:\s*60%/);

    // 목록 뷰로 돌아가 진행률 30 변경
    await page.getByRole('link', { name: '목록' }).click();
    await expect(page).toHaveURL(/\/$/);
    const taskRow = page.getByRole('row').filter({ hasText: taskTitle });
    await taskRow.getByRole('button', { name: '편집' }).click();
    await page.getByRole('spinbutton').first().fill('30');
    await page.getByRole('button', { name: '수정' }).click();
    await waitForDialogClosed(page);

    // 간트 재진입 → fill width: 30%
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);
    const idx2 = await page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('.gantt-row-left'));
      return rows.findIndex((r) => (r.textContent ?? '').includes(t));
    }, taskTitle);
    expect(idx2).toBeGreaterThanOrEqual(0);
    const fill2 = page.locator('.gantt-grid-row').nth(idx2).locator('.gantt-bar-fill');
    await expect(fill2).toHaveAttribute('style', /width:\s*30%/);
  });
});
