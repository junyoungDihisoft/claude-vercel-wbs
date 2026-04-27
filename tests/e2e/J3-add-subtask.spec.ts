import { test, expect } from '@playwright/test';

test.describe('J3 — 하위 작업 추가 (계층 생성)', () => {
  test('부모 행의 "+ 하위" 클릭 → 자식 저장 → ▼ 아이콘 + 들여쓰기 표시', async ({
    page,
  }) => {
    await page.goto('/');

    // 최상위 부모 작업 추가
    const parentTitle = `J3 부모 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(parentTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(parentTitle)).toBeVisible();

    // 부모 행의 "+ 하위" 버튼 클릭
    const parentRow = page.getByRole('row').filter({ hasText: parentTitle });
    await parentRow.getByRole('button', { name: '+ 하위' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 하위 작업 제목 입력 후 저장
    const childTitle = `J3 자식 ${Date.now()}`;
    await page.getByPlaceholder('작업 제목').fill(childTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 부모 행에 ▼ 아이콘 출현
    await expect(parentRow.getByRole('button', { name: '접기' })).toBeVisible();

    // 자식 행이 목록에 표시됨
    await expect(page.getByText(childTitle)).toBeVisible();
  });
});
