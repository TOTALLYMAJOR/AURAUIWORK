import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('staffing coverage uses counts and roster navigation keeps the selected shift', async ({ page }) => {
  await page.goto('/staffing');
  await expect(page.getByRole('status')).toHaveText('6 shifts shown · 4 unfilled roles in this view');
  await page.getByRole('button', { name: 'Coverage gaps', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('3 shifts shown · 4 unfilled roles in this view');
  const keel = page.getByRole('button', { name: 'Review Keel offices Server', exact: true });
  await keel.focus();
  await page.keyboard.press('Space');
  await expect(keel).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Source mismatch:')).toBeVisible();
  await page.getByRole('link', { name: 'Review crew for this shift' }).click();
  await expect(page).toHaveURL(/\/roster\?shift=s4$/);
  await expect(page.getByLabel('Target shift')).toHaveValue('s4');
  await page.getByRole('link', { name: 'Staffing', exact: true }).click();
  await page.getByRole('button', { name: 'Full coverage', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('3 shifts shown · 0 unfilled roles in this view');
  await expect(page.getByRole('region', { name: 'Selected shift' })).toContainText('Northline HQ');
  await expect(page.getByRole('region', { name: 'Selected shift' })).not.toContainText('Keel');
  await page.getByRole('link', { name: 'Review stock desk' }).click();
  await expect(page).toHaveURL(/\/inventory$/);
});

test('offers require an explicit person and shift, remain drafts, and clear on edits', async ({ page }) => {
  await page.goto('/roster?shift=not-real');
  await expect(page.getByRole('alert')).toContainText('not found');
  const prepare = page.getByRole('button', { name: 'Prepare offer draft' });
  await expect(prepare).toBeDisabled();
  await page.getByLabel('Target shift').selectOption('s1');
  await expect(prepare).toBeDisabled();
  await page.getByRole('button', { name: 'Review Asha Reid' }).click();
  await expect(prepare).toBeDisabled();
  await expect(page.getByText('This person is marked off.', { exact: false })).toBeVisible();
  const imani = page.getByRole('button', { name: 'Review Imani Cole' });
  await imani.focus();
  await page.keyboard.press('Enter');
  await prepare.click();
  await expect(page.getByRole('heading', { name: 'Local offer draft' })).toBeVisible();
  await expect(page.getByText('Not sent or saved. No acceptance recorded; shift coverage is unchanged.')).toBeVisible();
  await page.getByLabel('Target shift').selectOption('s3');
  await expect(page.getByRole('heading', { name: 'Local offer draft' })).toHaveCount(0);
  await prepare.click();
  await page.getByLabel('Crew status').selectOption('hold');
  await expect(page.getByRole('heading', { name: 'Local offer draft' })).toHaveCount(0);
  await expect(prepare).toBeDisabled();
  await page.getByRole('button', { name: 'Review Sam Ortiz' }).click();
  await prepare.click();
  await page.getByRole('button', { name: 'Discard offer draft' }).click();
  await expect(page.getByRole('heading', { name: 'Local offer draft' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to staffing floor' }).click();
  await expect(page.getByRole('status')).toHaveText('6 shifts shown · 4 unfilled roles in this view');
});

test('inventory selection follows filters without losing or pretending to reserve draft items', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page.getByRole('status')).toHaveText('8 items shown · 4 below par in this view');
  const detail = page.getByRole('region', { name: 'Selected stock item' });
  await page.getByRole('button', { name: 'Add to pull-list draft', exact: true }).click();
  const draft = page.getByRole('region', { name: 'Pull-list draft', exact: true });
  await expect(draft).toContainText('LIN-440');
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('Glass');
  await expect(detail).toContainText('Coupe glass');
  await expect(detail).not.toContainText('Black bistro linen');
  await expect(draft).toContainText('LIN-440');
  await page.getByLabel('Search inventory').fill('no matching stock');
  await expect(page.getByRole('status')).toHaveText('0 items shown · 0 below par in this view');
  await expect(detail).toHaveText('No stock item selected.');
  await expect(page.getByRole('button', { name: 'Add to pull-list draft', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove Black bistro linen from draft' }).click();
  await expect(draft).toContainText('No items added.');
  await page.getByLabel('Search inventory').fill('');
  const glass = page.getByRole('button', { name: 'Inspect Coupe glass' });
  await glass.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add to pull-list draft', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(draft).toContainText('GLS-12');
  await expect(detail).toContainText('186 pcs');
  await page.getByRole('button', { name: 'Clear pull-list draft' }).click();
  await expect(draft).toContainText('No items added.');
  await page.getByRole('button', { name: 'Add to pull-list draft', exact: true }).click();
  await page.getByRole('link', { name: 'Staffing', exact: true }).click();
  await page.getByRole('link', { name: 'Inventory', exact: true }).click();
  await expect(draft).toContainText('No items added.');
});

for (const width of [1440, 1024, 768, 390]) {
  test(`staffing routes fit and have no serious accessibility violations at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/staffing', '/roster', '/inventory']) {
      await page.goto(route);
      if (route === '/roster') {
        await page.getByLabel('Target shift').selectOption('s1');
        await page.getByRole('button', { name: 'Review Imani Cole' }).click();
        await page.getByRole('button', { name: 'Prepare offer draft' }).click();
      }
      if (route === '/inventory') await page.getByRole('button', { name: 'Add to pull-list draft', exact: true }).click();
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), route).toBe(width);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      for (const name of ['Command', 'Menu', 'Bookings', 'Staffing', 'Roster', 'Inventory']) await expect(page.getByRole('navigation').getByRole('link', { name, exact: true })).toBeVisible();
      const result = await new AxeBuilder({ page }).analyze();
      expect.soft(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), route).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}.png`), fullPage: true });
    }
  });
}
