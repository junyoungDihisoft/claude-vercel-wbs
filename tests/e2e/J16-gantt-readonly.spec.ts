import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';
import { isoDateOffset } from './_helpers/dates';

test.describe('J16 — 간트는 읽기 전용', () => {
  test('막대에 드래그 핸들러가 없고, 드래그/리사이즈 시도 후에도 위치·폭이 그대로다', async ({
    page,
  }) => {
    await page.goto('/');

    const taskTitle = `J16 읽기전용 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.locator('input[type="date"]').nth(0).fill(isoDateOffset(6));
    await page.locator('input[type="date"]').nth(1).fill(isoDateOffset(10));
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    await expect(page.getByText(taskTitle)).toBeVisible();

    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);

    const bar = page.locator('.gantt-bar').first();
    await expect(bar).toBeVisible();

    // SPEC §9 핵심 계약: 막대에 드래그 관련 핸들러·속성이 일체 없어야 한다.
    // (boundingBox 동치만 보면 pointer-events:none 같은 CSS 우회로 통과 가능.)
    await expect(bar).not.toHaveAttribute('draggable', 'true');
    const handlers = await bar.evaluate((el) => {
      const e = el as HTMLElement & {
        onpointerdown: unknown;
        onmousedown: unknown;
        ondragstart: unknown;
      };
      return {
        pointerdown: typeof e.onpointerdown === 'function',
        mousedown: typeof e.onmousedown === 'function',
        dragstart: typeof e.ondragstart === 'function',
      };
    });
    expect(handlers).toEqual({ pointerdown: false, mousedown: false, dragstart: false });

    const before = await bar.boundingBox();
    expect(before).not.toBeNull();

    // 막대 중앙에서 +120px 가량 우측으로 드래그 시도
    const cx = before!.x + before!.width / 2;
    const cy = before!.y + before!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy, { steps: 10 });
    await page.mouse.up();

    // 막대 끝(우측)을 잡아 리사이즈 시도
    const ex = before!.x + before!.width - 1;
    const ey = before!.y + before!.height / 2;
    await page.mouse.move(ex, ey);
    await page.mouse.down();
    await page.mouse.move(ex + 80, ey, { steps: 10 });
    await page.mouse.up();

    const after = await bar.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.width).toBeCloseTo(before!.width, 0);
  });
});
