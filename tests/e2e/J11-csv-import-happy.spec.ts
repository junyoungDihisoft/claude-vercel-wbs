import { test, expect } from '@playwright/test';

test.describe('J11 — CSV 가져오기 정상', () => {
  test('유효 CSV 3행 → 미리보기 확인 후 적용 → 기존 유지 + 3행 추가 + 계층 연결', async ({
    page,
  }) => {
    await page.goto('/');

    const ts = Date.now();

    // 기존 작업 2개 추가
    for (const title of [`J11 기존A ${ts}`, `J11 기존B ${ts}`]) {
      await page.getByRole('button', { name: '+ 작업 추가' }).click();
      await page.getByPlaceholder('작업 제목').fill(title);
      await page.getByRole('button', { name: '추가' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }

    // 가져올 CSV 준비 (두 번째 행이 첫 번째 행의 자식)
    const p = `J11 리서치 ${ts}`;
    const c = `J11 리서치 요약 ${ts}`;
    const r = `J11 리뷰 미팅 ${ts}`;
    const csvContent = [
      '제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목',
      `${p},경쟁사 조사,이대리,할 일,0,2026-05-04,2026-05-07,`,
      `${c},,이대리,할 일,0,2026-05-08,2026-05-08,${p}`,
      `${r},,김PM,할 일,0,2026-05-10,2026-05-10,`,
    ].join('\n');

    // CSV 불러오기 버튼 → 파일 선택
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 8000 });
    await page.getByRole('button', { name: 'CSV 불러오기' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });

    // 미리보기: "3개 작업을 추가합니다. 제외 0건"
    await expect(page.getByText('3개 작업을 추가합니다')).toBeVisible();
    await expect(page.getByText('제외 0건')).toBeVisible();

    // 적용 → 모달 닫힘 대기
    await page.getByRole('button', { name: '적용' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 기존 2개 + 신규 3개 존재 (exact: true 로 badge 오매칭 방지)
    await expect(page.getByText(`J11 기존A ${ts}`, { exact: true })).toBeVisible();
    await expect(page.getByText(`J11 기존B ${ts}`, { exact: true })).toBeVisible();
    await expect(page.getByText(p, { exact: true })).toBeVisible();
    await expect(page.getByText(c, { exact: true })).toBeVisible();
    await expect(page.getByText(r, { exact: true })).toBeVisible();

    // 자식 행이 부모 아래 들여쓰기로 표시됨 (▼ 아이콘 확인)
    const parentRow = page.getByRole('row').filter({ hasText: p });
    await expect(parentRow.getByRole('button', { name: '접기' })).toBeVisible();
  });
});
