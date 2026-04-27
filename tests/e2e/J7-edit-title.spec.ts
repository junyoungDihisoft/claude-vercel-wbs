import { test, expect } from '@playwright/test';

test.describe('J7 — 제목 수정 즉시 반영', () => {
  test('편집 버튼으로 제목을 변경하면 목록에 즉시 반영된다', async ({
    page,
  }) => {
    await page.goto('/');

    // 테스트용 작업 생성
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    const originalTitle = `J7 원본 ${Date.now()}`;
    await page.getByPlaceholder('작업 제목').fill(originalTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByText(originalTitle)).toBeVisible();

    // 해당 행의 편집 버튼 클릭
    const row = page.getByRole('row').filter({ hasText: originalTitle });
    await row.getByRole('button', { name: '편집' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 제목 수정
    const updatedTitle = `J7 수정됨 ${Date.now()}`;
    const titleInput = page.getByPlaceholder('작업 제목');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);
    await page.getByRole('button', { name: '수정' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText(originalTitle)).not.toBeVisible();
  });
});
