import { test, expect } from '@playwright/test';

test.describe('J12 — CSV 가져오기 부분 오류', () => {
  test('제목 누락 행 제외 + 상위 매칭 실패 경고 → 미리보기 후 적용', async ({ page }) => {
    await page.goto('/');

    const ts = Date.now();
    const doc = `J12 문서화 ${ts}`;
    const qa = `J12 QA ${ts}`;

    const csvContent = [
      '제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목',
      `${doc},,김PM,할 일,0,2026-05-11,2026-05-12,`,
      `,설명만 있음,,,,,,`,
      `${qa},,박테스터,할 일,0,2026-05-13,2026-05-14,존재하지않는부모${ts}`,
    ].join('\n');

    // CSV 불러오기 버튼 → 파일 선택
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 8000 });
    await page.getByRole('button', { name: 'CSV 불러오기' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'import-errors.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });

    // 미리보기: "2개 작업을 추가합니다. 제외 1건"
    await expect(page.getByText('2개 작업을 추가합니다')).toBeVisible();
    await expect(page.getByText('제외 1건')).toBeVisible();

    // 제외 사유: "2행: 제목 누락"
    await expect(page.getByText('2행: 제목 누락')).toBeVisible();

    // QA 행의 상위 매칭 실패 경고 (제외 아님)
    await expect(page.getByText(/상위 매칭 실패|최상위/)).toBeVisible();

    // 적용
    await page.getByRole('button', { name: '적용' }).click();

    // 문서화, QA 추가됨
    await expect(page.getByText(doc)).toBeVisible();
    await expect(page.getByText(qa)).toBeVisible();

    // "설명만 있음" 은 추가되지 않음
    await expect(page.getByText(`설명만 있음`)).not.toBeVisible();
  });
});
