import { test, expect } from '@playwright/test';

test('unsupported date and kitchen filters explain their missing data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sample scope' }).click();
  await expect(page.getByLabel('Date range')).toBeDisabled();
  await expect(page.getByLabel('Kitchen', { exact: true })).toBeDisabled();
  await expect(page.getByText(/Service dates and kitchen assignments are unavailable/)).toBeVisible();
});

test('search scopes the queue, focus, totals and empty state together', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Search' }).fill('Corporate');
  await expect(page.getByRole('region', { name: 'Next decision' })).toContainText('Corporate lunch');
  await expect(page.getByRole('region', { name: 'Business snapshot' })).toContainText('$2,140');
  await expect(page.getByRole('button', { name: /^Needs action\s*1$/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Open Corporate lunch', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Event detail' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search' }).fill('nothing-matches');
  await expect(page.getByRole('complementary', { name: 'Event detail' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Next decision' })).toContainText('No events in this view');
  await expect(page.getByRole('region', { name: 'Next decision' }).getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Business snapshot' })).not.toContainText('$2,140');
  await page.getByRole('textbox', { name: 'Search' }).fill('');
  await expect(page.getByRole('complementary', { name: 'Event detail' })).toHaveCount(0);
});

test('role and queue switches scope the focus and financial snapshot', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Role', { exact: true }).selectOption('Sales');
  await expect(page.getByRole('region', { name: 'Next decision' })).toContainText('Harbor tasting');
  await expect(page.getByRole('button', { name: /Booked event value/ })).toContainText('$0');
  await page.getByRole('group', { name: 'Queue view' }).getByRole('button', { name: /^Needs action/ }).click();
  await expect(page.getByRole('region', { name: 'Next decision' })).toContainText('Rivera Summer Social');
  await expect(page.getByRole('button', { name: /Booked event value/ })).toContainText('$63,140');
  await expect(page.getByRole('tab')).toHaveCount(0);
});

test('event buttons work by keyboard, preserve focus during updates, and restore it on close', async ({ page }) => {
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open Rivera Summer Social', exact: true });
  for (let step = 0; step < 24 && !(await open.evaluate((button) => button === document.activeElement)); step++) {
    await page.keyboard.press('Tab');
  }
  await expect(open).toBeFocused();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('complementary', { name: 'Event detail' });
  await expect(drawer.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await drawer.getByRole('button', { name: 'Other actions' }).click();
  const owner = drawer.getByRole('textbox', { name: 'Owner', exact: true });
  await owner.fill('Alex');
  await expect(owner).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  await page.keyboard.press('Space');
  await expect(drawer).toBeVisible();
  await page.getByRole('button', { name: 'Open in panel', exact: true }).click();
  await expect(drawer.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await drawer.getByRole('button', { name: 'Next event in this view' }).click();
  await expect(drawer.getByRole('heading', { name: 'Corporate lunch' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open Corporate lunch', exact: true })).toBeFocused();
});

test('secondary queues open a matching view and next stays in that view', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /quotes waiting/ }).click();
  await page.getByRole('button', { name: 'Board dinner', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Sales\s*2$/ })).toHaveAttribute('aria-pressed', 'true');
  const drawer = page.getByRole('complementary', { name: 'Event detail' });
  await drawer.getByRole('button', { name: 'Next event in this view' }).click();
  await expect(drawer.getByRole('heading', { name: 'Harbor tasting', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open Harbor tasting', exact: true })).toBeFocused();
});

test('booking drafts require explicit guests and do not invent a service type or persistence', async ({ page }) => {
  await page.goto('/reservations');
  await expect(page.getByLabel('Guests', { exact: true })).toHaveValue('');
  await page.getByLabel('Event name').fill('Test event');
  await page.getByLabel('Service date').fill('2027-06-10');
  await page.getByLabel('Guests', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Prepare inquiry draft' }).click();
  await expect(page.getByRole('status')).toContainText('Service type: Not specified');
  await expect(page.getByRole('status')).toContainText('Not saved to bookings');
  await expect(page.getByRole('status')).toContainText('2027-06-10');
  await page.getByLabel('Event name').fill('Revised event');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('collapsing optional booking details preserves explicit choices and notes', async ({ page }) => {
  await page.goto('/reservations');
  await page.getByLabel('Event name').fill('Test event');
  await page.getByLabel('Service date').fill('2027-06-10');
  await page.getByLabel('Guests', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Add service details' }).click();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Plated service', exact: true }).check();
  await page.getByLabel('Notes').fill('Nut allergy');
  await page.getByRole('button', { name: 'Hide service details' }).click();
  await page.getByRole('button', { name: 'Prepare inquiry draft' }).click();
  await expect(page.getByRole('status')).toContainText('Service type: Plated service');
  await expect(page.getByRole('status')).toContainText('Nut allergy');
  await page.getByRole('button', { name: 'Add service details' }).click();
  await expect(page.getByLabel('Notes')).toHaveValue('Nut allergy');
  await page.getByRole('button', { name: 'Clear service type' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('invalid booking values cannot produce a prepared draft', async ({ page }) => {
  await page.goto('/reservations');
  const prepare = page.getByRole('button', { name: 'Prepare inquiry draft' });
  await prepare.click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByLabel('Event name').fill('   ');
  await page.getByLabel('Service date').fill('2027-06-10');
  await page.getByLabel('Guests', { exact: true }).fill('12');
  await prepare.click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByLabel('Event name').fill('Valid name');
  await page.getByLabel('Guests', { exact: true }).fill('1.5');
  await prepare.click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByLabel('Guests', { exact: true }).fill('0');
  await prepare.click();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('route links reach the three implemented screens', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Bookings', exact: true }).click();
  await expect(page).toHaveURL(/\/reservations$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Command', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Next decision' })).toBeVisible();
});
