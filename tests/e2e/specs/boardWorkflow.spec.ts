import { test, expect } from '@playwright/test';
import { BoardPage } from '../pageObjects/BoardPage';
import { LoginPage } from '../pageObjects/LoginPage';
import { deleteProjectsByName } from '../support/api';

test('admin can create a project board list and card', async ({ page, request }) => {
  const loginPage = new LoginPage(page);
  const boardPage = new BoardPage(page);
  const uniqueId = Date.now().toString().slice(-8);
  const projectName = `E2E Project ${uniqueId}`;
  const boardName = `E2E Board ${uniqueId}`;
  const listName = `Ready ${uniqueId}`;
  const cardName = `Validate E2E workflow ${uniqueId}`;

  try {
    await test.step('Log in as admin', async () => {
      await loginPage.navigateToLoginPage();
      await loginPage.loginToDashboard('demo', 'demo');
      await expect(page).toHaveURL(loginPage.dashboardUrl);
      await expect(loginPage.dashboardTitle).toBeVisible({ timeout: 15000 });
    });

    await test.step('Create and open a project', async () => {
      await boardPage.createProject(projectName);
      await boardPage.openProject(projectName);
    });

    await test.step('Create and open a board', async () => {
      await boardPage.createBoard(boardName);
      await boardPage.openBoard(boardName);
    });

    await test.step('Create a list and card', async () => {
      await boardPage.createList(listName);
      await boardPage.createCard(cardName);
    });

    await test.step('Open the card from the board', async () => {
      await boardPage.openCard(cardName);
      await expect(boardPage.cardModalTitle(cardName)).toBeVisible();
      await expect(boardPage.listHeader(listName)).toBeVisible();
    });

    await test.step('Validate the card persists after returning to the board and reloading', async () => {
      await boardPage.closeCard();
      await page.reload();
      await expect(boardPage.card(cardName)).toBeVisible({ timeout: 15000 });
    });
  } finally {
    await deleteProjectsByName(page, request, [projectName]).catch((error: unknown) => {
      console.warn(`Cleanup failed for project ${projectName}:`, error);
    });
  }
});
