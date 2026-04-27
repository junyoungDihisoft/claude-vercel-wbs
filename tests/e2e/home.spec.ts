import { test, expect } from '@playwright/test';

test('home renders WBS heading under Chakra provider', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: /WBS/i }),
  ).toBeVisible();
});
