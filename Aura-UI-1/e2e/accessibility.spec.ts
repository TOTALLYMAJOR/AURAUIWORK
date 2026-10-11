import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1440, 1280, 1024, 768, 390]) {
  test(`affected routes fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/reservations']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(documentWidth, `${route} document width`).toBe(width);
      await page.screenshot({ path: testInfo.outputPath(`${route === '/' ? 'queue' : 'booking'}.png`), fullPage: true });
      if (route === '/') {
        await page.getByRole('button', { name: 'Open Rivera Summer Social', exact: true }).click();
        expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), 'drawer document width').toBe(width);
        await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
        const progress = page.getByRole('list', { name: 'Event progress' });
        expect.soft(await progress.evaluate((list) => {
          const bottom = list.getBoundingClientRect().bottom;
          return [...list.querySelectorAll('span')].every((label) => label.getBoundingClientRect().bottom <= bottom);
        }), 'event progress labels must not be vertically clipped').toBe(true);
        await page.screenshot({ path: testInfo.outputPath('drawer.png'), fullPage: true });
      }
    }
  });
}

test('affected open states have no serious or critical accessibility violations', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sample scope' }).click();
  await page.getByRole('button', { name: 'Position & readiness' }).click();
  await page.getByRole('button', { name: 'Open Rivera Summer Social', exact: true }).click();
  const queue = await new AxeBuilder({ page }).analyze();
  await testInfo.attach('queue-axe', { body: JSON.stringify(queue.violations, null, 2), contentType: 'application/json' });
  expect.soft(queue.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, targets: v.nodes.map((node) => node.target) }))).toEqual([]);
  await page.goto('/reservations');
  await page.getByRole('button', { name: 'Add service details' }).click();
  const booking = await new AxeBuilder({ page }).analyze();
  await testInfo.attach('booking-axe', { body: JSON.stringify(booking.violations, null, 2), contentType: 'application/json' });
  expect.soft(booking.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, targets: v.nodes.map((node) => node.target) }))).toEqual([]);
});
