import { test, expect } from '@playwright/test';
import { LoginPage } from '../pageObjects/LoginPage';

test('admin user logs in with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await test.step('Navigate to login page', async () => {
    await loginPage.navigateToLoginPage();
    await expect(page).toHaveURL(loginPage.loginUrl);
  });

  await test.step('Log in with admin credentials', async () => {
    await loginPage.loginToDashboard('demo', 'demo');
  });

  await test.step('Validate dashboard is visible', async () => {
    await expect(page).toHaveURL(loginPage.dashboardUrl);
    await expect(loginPage.dashboardTitle).toBeVisible({ timeout: 15000 });
  });
});

test('user remains on login page with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await test.step('Navigate to login page', async () => {
    await loginPage.navigateToLoginPage();
    await expect(page).toHaveURL(loginPage.loginUrl);
  });

  await test.step('Attempt login with invalid credentials', async () => {
    await loginPage.loginToDashboard('demo', 'not-the-demo-password');
  });

  await test.step('Validate access is denied without leaving login', async () => {
    await expect(page).toHaveURL(loginPage.loginUrl);
    await expect(page.getByText('Invalid username or password')).toBeVisible({ timeout: 15000 });
    await expect(loginPage.passwordField).toBeFocused();
  });
});
