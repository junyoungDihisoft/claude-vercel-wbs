import { test, expect } from '@playwright/test';

test.describe('J13 — 간트 뷰로 전환', () => {
  test('토글에서 "간트" 클릭 시 /gantt 라우트, 좌측 트리·우측 그리드·오늘 강조선·"일정 없음" 표기', async ({
    page,
  }) => {
    await page.goto('/');

    // 시작일/기한 모두 있는 작업
    const tsScheduled = `J13 일정있음 ${Date.now()}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(tsScheduled);
    await page.getByLabel('시작일').fill('2026-05-04');
    await page.getByLabel('목표 기한').fill('2026-05-08');
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 일정 없는 작업
    const tsNoDates = `J13 일정없음 ${Date.now() + 1}`;
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(tsNoDates);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 토글 → 간트
    await page.getByRole('link', { name: '간트' }).click();
    await expect(page).toHaveURL(/\/gantt$/);

    // 좌측 트리: 두 작업의 제목이 좌측 영역에 보임
    await expect(page.getByText(tsScheduled)).toBeVisible();
    await expect(page.getByText(tsNoDates)).toBeVisible();

    // 우측 그리드 + 오늘 세로선
    await expect(page.locator('.gantt-today')).toHaveCount(1);

    // 일정 있는 작업 행에 막대 1개 이상
    await expect(page.locator('.gantt-bar').first()).toBeVisible();

    // 일정 없는 작업 행에 "일정 없음" 표기
    await expect(page.locator('.gantt-empty-bar', { hasText: '일정 없음' }).first()).toBeVisible();
  });
});
