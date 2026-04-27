import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

test.describe('J10 — CSV 내보내기', () => {
  test('CSV 내보내기 클릭 → 파일명/헤더/자식-부모 제목 일치', async ({ page }) => {
    await page.goto('/');

    const ts = Date.now();
    const parentTitle = `J10 부모 ${ts}`;
    const childTitle = `J10 자식 ${ts}`;

    // 부모 작업 추가
    await page.getByRole('button', { name: '+ 작업 추가' }).click();
    await page.getByPlaceholder('작업 제목').fill(parentTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 하위 작업 추가
    const parentRow = page.getByRole('row').filter({ hasText: parentTitle });
    await parentRow.getByRole('button', { name: '+ 하위' }).click();
    await page.getByPlaceholder('작업 제목').fill(childTitle);
    await page.getByRole('button', { name: '추가' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // CSV 내보내기
    const downloadPromise = page.waitForEvent('download', { timeout: 8000 });
    await page.getByRole('button', { name: 'CSV 내보내기' }).click();
    const download = await downloadPromise;

    // 파일명 패턴: wbs-YYYY-MM-DD.csv
    const today = new Date().toISOString().slice(0, 10);
    expect(download.suggestedFilename()).toBe(`wbs-${today}.csv`);

    // 파일 본문 검증
    const filePath = await download.path();
    const raw = await fs.readFile(filePath!);
    // UTF-8 + BOM 처리
    const text = raw.toString('utf-8').replace(/^﻿/, '');
    const lines = text.split('\n').map((l) => l.trimEnd()).filter(Boolean);

    // 헤더 (공백 없음)
    expect(lines[0]).toBe('제목,설명,담당자,상태,진행률,시작일,목표 기한,상위 작업 제목');

    // 자식 행의 8번째 셀(상위 작업 제목)이 부모 제목
    const childLine = lines.find((l) => l.startsWith(childTitle));
    expect(childLine).toBeDefined();
    const cells = childLine!.split(',');
    expect(cells[7]).toBe(parentTitle);

    // 최상위 부모 행의 마지막 셀은 빈 문자열
    const parentLine = lines.find((l) => l.startsWith(parentTitle));
    expect(parentLine).toBeDefined();
    const parentCells = parentLine!.split(',');
    expect(parentCells[7]).toBe('');
  });
});
