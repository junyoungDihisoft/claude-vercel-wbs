import { test, expect } from '@playwright/test';

test.describe('J4 — 계층 접기/펼치기', () => {
  test('▼ 클릭 → 자식 숨김 + ▶, 재클릭 → 자식 다시 표시 + ▼', async ({
    page,
  }) => {
    await page.goto('/');

    // 부모 추가
    const parentTitle = `J4 부모 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(parentTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 자식 추가
    const childTitle = `J4 자식 ${Date.now()}`;
    const parentRow = page.getByRole('row').filter({ hasText: parentTitle });
    await parentRow.getByRole('button', { name: '+ 하위' }).click();
    await page.getByPlaceholder('작업 제목').fill(childTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 초기 상태: 자식 보임, ▼(접기 버튼)
    await expect(page.getByText(childTitle)).toBeVisible();
    const collapseBtn = parentRow.getByRole('button', { name: '접기' });
    await expect(collapseBtn).toBeVisible();

    // ▼ 클릭 → 접힘
    await collapseBtn.click();
    await expect(page.getByText(childTitle)).not.toBeVisible();
    await expect(parentRow.getByRole('button', { name: '펼치기' })).toBeVisible();

    // ▶ 클릭 → 다시 펼침
    await parentRow.getByRole('button', { name: '펼치기' }).click();
    await expect(page.getByText(childTitle)).toBeVisible();
    await expect(parentRow.getByRole('button', { name: '접기' })).toBeVisible();
  });
});
