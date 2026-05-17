import { test, expect } from '@playwright/test';
import { LoginPage } from '../pageObjects/LoginPage';
import { UserSettingPage } from '../pageObjects/UserSettingPage';
import { deleteUsersByEmail } from '../support/api';

test('admin user can create a new user', async ({ page, request }) => {
  const loginPage = new LoginPage(page);
  const userSettingPage = new UserSettingPage(page);
  const createdUserEmails: string[] = [];
  const uniqueId = Date.now().toString().slice(-8);

  const user = {
    email: `e2e-user-${uniqueId}@example.com`,
    password: 'Abcde@123',
    name: `E2E User ${uniqueId}`,
    username: `e2e_${uniqueId}`,
  };

  try {
    await test.step('Log in as admin', async () => {
      await loginPage.navigateToLoginPage();
      await expect(page).toHaveURL(loginPage.loginUrl);
      await loginPage.loginToDashboard('demo', 'demo');
      await expect(page).toHaveURL(loginPage.dashboardUrl);
      await expect(loginPage.dashboardTitle).toBeVisible({ timeout: 15000 });
    });

    await test.step('Navigate to users setting page', async () => {
      await userSettingPage.navigateToUsersSettingPage();
    });

    await test.step('Create new user', async () => {
      await userSettingPage.addUserButton.click();
      await userSettingPage.addUser(user.email, user.password, user.name, user.username);
      createdUserEmails.push(user.email);
    });

    await test.step('Verify new user appears in list', async () => {
      await expect(page.locator(`div[title='${user.email}']`)).toBeVisible();
    });
  } finally {
    if (!createdUserEmails.length) {
      return;
    }

    await deleteUsersByEmail(page, request, [...createdUserEmails].reverse()).catch((error: unknown) => {
      console.warn(`Cleanup failed for users ${createdUserEmails.join(', ')}:`, error);
    });
  }
});
