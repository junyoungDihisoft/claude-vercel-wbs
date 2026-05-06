import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';

test.describe('J19 — stats 카드 구조 및 진척률 표시', () => {
  test('작업 추가 후 stats-strip 4칸 카드가 올바른 구조로 렌더된다', async ({ page }) => {
    await page.goto('/');

    const ts = Date.now();

    // done 작업 1건 추가 (진척률/완료 카드 값이 존재하는지 확인용)
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(`J19 done ${ts}`);
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    const doneRow = page.getByRole('row').filter({ hasText: `J19 done ${ts}` });
    await doneRow.getByRole('button', { name: '할 일' }).click();
    await expect(doneRow.getByText('진행 중')).toBeVisible();
    await doneRow.getByRole('button', { name: '진행 중' }).click();
    await expect(doneRow.getByText('완료')).toBeVisible();

    // doing 작업 1건 추가
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(`J19 doing ${ts}`);
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);
    const doingRow = page.getByRole('row').filter({ hasText: `J19 doing ${ts}` });
    await doingRow.getByRole('button', { name: '할 일' }).click();
    await expect(doingRow.getByText('진행 중')).toBeVisible();

    // I-1: WBS 제목 노출 — PageHeader는 h2 (h1 은 AppHeader 브랜드)
    await expect(page.getByRole('heading', { level: 2, name: 'WBS' })).toBeVisible();

    // I-2: 메타 한 줄 "n개 작업" 노출
    await expect(page.getByText(/개 작업/)).toBeVisible();

    // I-3: stats-strip 4칸 구조 확인 (라벨 + 서브텍스트)
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
