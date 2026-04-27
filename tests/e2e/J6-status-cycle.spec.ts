import { test, expect } from '@playwright/test';

test.describe('J6 — 상태 배지 인라인 순환 전환', () => {
  test('배지 클릭마다 todo→doing→done→todo 순환하고 진행률은 변하지 않는다', async ({
    page,
  }) => {
    await page.goto('/');

    // 테스트용 작업 생성 (진행률 기본 0)
    const taskTitle = `J6 테스트 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    const row = page.getByRole('row').filter({ hasText: taskTitle });

    // 초기 상태 확인
    await expect(row.getByText('할 일')).toBeVisible();

    // 초기 진행률 텍스트 캡처 (역방향 동기화 없음 검증용)
    const progressText = await row.getByText(/^\d+%$/).textContent();

    // 1회 클릭 → 진행 중
    await row.getByRole('button', { name: '할 일' }).click();
    await expect(row.getByText('진행 중')).toBeVisible();

    // 2회 클릭 → 완료
    await row.getByRole('button', { name: '진행 중' }).click();
    await expect(row.getByText('완료')).toBeVisible();

    // 3회 클릭 → 할 일 (순환)
    await row.getByRole('button', { name: '완료' }).click();
    await expect(row.getByText('할 일')).toBeVisible();

    // 진행률은 그대로 — 역방향 동기화 없음
    await expect(row.getByText(progressText!)).toBeVisible();

    // 새로고침 후에도 마지막 상태("할 일") 유지
    await page.reload();
    const rowAfterReload = page.getByRole('row').filter({ hasText: taskTitle });
    await expect(rowAfterReload.getByText('할 일')).toBeVisible();
  });
});
