import { test, expect } from '@playwright/test';

test.describe('MyNote App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/MyNote/);
  });

  test('should have titlebar', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const titlebar = page.locator('#titlebar');
    await expect(titlebar).toBeVisible();
  });

  test('should have activity bar', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const activityBar = page.locator('#activity-bar');
    await expect(activityBar).toBeVisible();
  });

  test('should have sidebar', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should have status bar', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const statusbar = page.locator('#statusbar');
    await expect(statusbar).toBeVisible();
  });

  test('should have editor area', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const editors = page.locator('#editors');
    await expect(editors).toBeVisible();
  });

  test('should have tabs', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const tabs = page.locator('#tabs');
    await expect(tabs).toBeVisible();
  });

  test('should have terminal panel (hidden by default)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const terminal = page.locator('#terminal-panel');
    await expect(terminal).toHaveClass(/hidden/);
  });

  test('should have find panel (hidden by default)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const findPanel = page.locator('#find-panel');
    await expect(findPanel).toHaveClass(/hidden/);
  });

  test('should have command palette (hidden by default)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const palette = page.locator('#command-palette');
    await expect(palette).toHaveClass(/hidden/);
  });
});
