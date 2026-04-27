import { test, expect } from '@playwright/test';

test.describe('J8 — 하위 포함 삭제', () => {
  test('삭제 버튼 클릭 시 확인 다이얼로그가 표시된다', async ({ page }) => {
    await page.goto('/');

    // 테스트용 작업 생성
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    const taskTitle = `J8 삭제 대상 ${Date.now()}`;
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();

    // 삭제 버튼 클릭
    const row = page.getByRole('row').filter({ hasText: taskTitle });
    await row.getByRole('button', { name: '삭제' }).click();

    // 확인 다이얼로그 표시
    await expect(page.getByRole('alertdialog')).toBeVisible();
    // 하위 없음 → 단순 메시지
    await expect(
      page.getByText(`'${taskTitle}' 작업을 삭제하시겠습니까?`),
    ).toBeVisible();
  });

  test('삭제 확인 후 목록에서 사라진다', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    const taskTitle = `J8 삭제됨 ${Date.now()}`;
    await page.getByPlaceholder('작업 제목').fill(taskTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: taskTitle });
    await row.getByRole('button', { name: '삭제' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // 삭제 확인 버튼 (alertdialog 내 빨간 삭제 버튼)
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await expect(page.getByText(taskTitle)).not.toBeVisible();
  });

  // TODO: 하위 작업 생성 UI가 추가되면(#4) "하위 작업 N개" 문구 테스트 추가
});
