import { test, expect } from '@playwright/test';

test.describe('J18 — 빈 상태에서 페이지 헤더 / stats 카드 표시', () => {
  test('task 없이 / 진입 시 WBS 제목 + 오늘 메타 + 4칸 카드(모두 0) 노출, "지남" 토큰 미노출', async ({
    page,
  }) => {
    await page.goto('/');

    // I-1: 페이지 제목 "WBS"
    await expect(page.getByRole('heading', { name: 'WBS' })).toBeVisible();

    // I-2: 메타 한 줄 — "0개 작업" 포함, "지남" 미포함
    await expect(page.getByText(/0개 작업/)).toBeVisible();
    await expect(page.locator('.page-meta__overdue')).toHaveCount(0);

    // I-3: 4칸 카드 모두 노출 (라벨 기준)
    await expect(page.getByText('전체')).toBeVisible();
    await expect(page.getByText('완료')).toBeVisible();
    await expect(page.getByText('진행 중')).toBeVisible();
    await expect(page.getByText('지남')).toBeVisible();
  });
});
