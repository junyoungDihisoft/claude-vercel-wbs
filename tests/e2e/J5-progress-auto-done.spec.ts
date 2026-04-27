import { test, expect } from '@playwright/test';

test.describe('J5 — 진행률 100% → 상태 자동 "완료"', () => {
  test('진행률 100 저장 후 상태 배지가 "완료"로 바뀐다', async ({ page }) => {
    await page.goto('/');

    // 테스트용 작업 생성 (진행률 0, 상태 "할 일")
    const taskTitle = `J5 테스트 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 방금 만든 행에 "할 일" 배지가 있는지 확인
    const row = page.getByRole('row').filter({ hasText: taskTitle });
    await expect(row.getByText('할 일')).toBeVisible();

    // 편집 모달 열기 → 진행률 100 입력 → 저장
    await row.getByRole('button', { name: '편집' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const progressInput = page.getByRole('spinbutton');
    await progressInput.fill('100');
    await page.getByRole('button', { name: '수정' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 재렌더 후 상태 배지가 "완료"여야 함
    await expect(row.getByText('완료')).toBeVisible();
    await expect(row.getByText('할 일')).not.toBeVisible();
  });
});
