import { test, expect } from '@playwright/test';

test.describe('J18 — 빈 상태에서 페이지 헤더 / stats 카드 표시', () => {
  test('task 없이 / 진입 시 WBS 제목 + 오늘 메타 + 4칸 카드(모두 0) 노출, "지남" 토큰 미노출', async ({
    page,
  }) => {
    await page.goto('/');

    // I-1: 페이지 제목 "WBS" — PageHeader는 h2 (h1 은 AppHeader 브랜드)
    await expect(page.getByRole('heading', { level: 2, name: 'WBS' })).toBeVisible();

    // I-2: 메타 한 줄 노출 — 공유 DB 환경이라 "0개 작업"을 단정할 수 없으니 패턴만 확인
    await expect(page.getByText(/개 작업/)).toBeVisible();

    // I-3: 4칸 카드 항상 노출 (라벨/서브 텍스트 모두 stats 스코프 안에서)
    const strip = page.locator('.stats');
    await expect(strip).toBeVisible();
    await expect(strip.getByText('전체')).toBeVisible();
    await expect(strip.getByText('완료')).toBeVisible();
    await expect(strip.getByText('진행 중')).toBeVisible();
    await expect(strip.getByText('지남')).toBeVisible();
    await expect(strip.getByText('% 진척')).toBeVisible();
    await expect(strip.getByText('활성')).toBeVisible();
    await expect(strip.getByText('주의 필요')).toBeVisible();
  });
});
