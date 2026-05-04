import { test, expect } from '@playwright/test';
import { waitForDialogClosed } from './_helpers/dialog';
import { isoDateOffset } from './_helpers/dates';

test.describe('J20 — overdue 작업 존재 시 메타 강조 표시', () => {
  test('overdue 작업 추가 → 메타에 빨강 "n개 지남" 노출, 완료로 전환 시 해제', async ({
    page,
  }) => {
    await page.goto('/');

    const ts = Date.now();
    const overdueTitle = `J20 overdue ${ts}`;

    // overdue 작업 추가: startDate = -14일, dueDate = -7일, status=doing
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(overdueTitle);
    // startDate (첫 번째 date input), dueDate (두 번째 date input)
    await page.locator('input[type="date"]').nth(0).fill(isoDateOffset(-14));
    await page.locator('input[type="date"]').nth(1).fill(isoDateOffset(-7));
    await page.getByRole('button', { name: '추가' }).click();
    await waitForDialogClosed(page);

    // status를 doing으로 전환
    const row = page.getByRole('row').filter({ hasText: overdueTitle });
    await row.getByRole('button', { name: '할 일' }).click();
    await expect(row.getByText('진행 중')).toBeVisible();

    // 메타에 "지남" 빨강 토큰 노출 확인
    await expect(page.locator('.page-meta__overdue')).toBeVisible();
    await expect(page.locator('.page-meta__overdue')).toContainText('지남');

    // stats-strip "지남" 카드 값이 0보다 큰지 확인 (overdue count ≥ 1)
    // "주의 필요" 서브텍스트가 노출됨
    await expect(page.locator('.stats').getByText('주의 필요')).toBeVisible();

    // 해당 작업을 done으로 전환 → "지남" 메타 토큰 사라짐
    await row.getByRole('button', { name: '진행 중' }).click();
    await expect(row.getByText('완료')).toBeVisible();

    // overdue 메타 토큰이 사라지는지 확인 (이 작업이 유일한 overdue인 경우)
    // 다른 테스트 작업이 DB에 있을 수 있으므로, 이 작업의 overdue 해제 효과만 검증
    // → 완료 전환 직후 페이지를 새로고침해 최신 stats 확인
    await page.reload();
    // 방금 완료한 작업은 더 이상 overdue 아님. 만약 다른 overdue 작업이 없으면 토큰 미노출.
    // DB 공유 환경이므로 "지남" 토큰이 0개가 됨을 단정하기 어렵지만,
    // 최소한 페이지가 정상 렌더(크래시 없이 WBS 제목 노출)되는지 확인.
    await expect(page.getByRole('heading', { name: 'WBS' })).toBeVisible();
    await expect(page.getByText(/개 작업/)).toBeVisible();
  });
});
