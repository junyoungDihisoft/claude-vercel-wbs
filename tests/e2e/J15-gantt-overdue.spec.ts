import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';
import { isoDateOffset } from './_helpers/dates';

test.describe('J15 — 간트 뷰 overdue 시각 표시', () => {
  test('기한 지난 미완료 작업 간트 막대에 overdue 클래스 → 완료 전환 시 해제', async ({
    page,
  }) => {
    await page.goto('/');

    const taskTitle = `J15 간트초과 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.locator('input[type="date"]').nth(0).fill(isoDateOffset(-7));
    await page.locator('input[type="date"]').nth(1).fill(isoDateOffset(-3));
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    await expect(page.getByText(taskTitle)).toBeVisible();

    // 간트 진입
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);

    // J14 패턴: 좌측 행 인덱스 찾고 같은 인덱스의 우측 .gantt-bar 확인
    const idx = await page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('.gantt-row-left'));
      return rows.findIndex((r) => (r.textContent ?? '').includes(t));
    }, taskTitle);
    expect(idx).toBeGreaterThanOrEqual(0);

    const bar = page.locator('.gantt-grid-row').nth(idx).locator('.gantt-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveClass(/overdue/);

    // 목록으로 돌아가 상태 → 완료
    await page.getByRole('link', { name: '목록' }).click();
    await expect(page).toHaveURL(/\/$/);
    const row = page.getByRole('row').filter({ hasText: taskTitle });
    await row.getByRole('button', { name: '할 일' }).click();
    await expect(row.getByText('진행 중')).toBeVisible();
    await row.getByRole('button', { name: '진행 중' }).click();
    await expect(row.getByText('완료')).toBeVisible();

    // 간트 재진입 → overdue 클래스 없음
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);
    const idx2 = await page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('.gantt-row-left'));
      return rows.findIndex((r) => (r.textContent ?? '').includes(t));
    }, taskTitle);
    expect(idx2).toBeGreaterThanOrEqual(0);
    const bar2 = page.locator('.gantt-grid-row').nth(idx2).locator('.gantt-bar');
    await expect(bar2).not.toHaveClass(/overdue/);
  });
});
