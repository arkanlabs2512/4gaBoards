import { expect, Locator, Page } from '@playwright/test';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class BoardPage {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public projectTile(name: string): Locator {
    return this.page.getByTitle(name, { exact: true }).filter({ hasText: name }).first();
  }

  public boardTile(name: string): Locator {
    return this.page.getByTitle(name, { exact: true }).filter({ hasText: name }).first();
  }

  public listHeader(name: string): Locator {
    return this.page.getByTitle(name, { exact: true }).filter({ hasText: name }).first();
  }

  public card(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${escapeRegExp(name)}(?:\\s|$)`) }).first();
  }

  public cardModalTitle(name: string): Locator {
    return this.page.getByTitle(name, { exact: true }).filter({ hasText: name }).last();
  }

  public async createProject(name: string): Promise<void> {
    await this.page.locator("button[title='Add Project']").filter({ hasText: 'Add Project' }).first().click();

    const form = this.page.locator('form').filter({ has: this.page.locator("input[name='name']") }).last();
    await form.locator("input[name='name']").fill(name);
    await form.locator("button[title='Add Project']").click();

    await expect(this.projectTile(name)).toBeVisible({ timeout: 10_000 });
  }

  public async openProject(name: string): Promise<void> {
    await this.projectTile(name).click();
    await expect(this.page).toHaveURL(/\/projects\/[^/]+$/);
  }

  public async createBoard(name: string): Promise<void> {
    await this.page.locator("button[title='Add Board']").filter({ hasText: 'Add Board' }).first().click();

    const form = this.page.locator('form').filter({ has: this.page.locator("input[name='name']") }).last();
    await form.locator("input[name='name']").fill(name);
    await form.locator("button[title='Add Board']").click();

    await expect(this.boardTile(name)).toBeVisible({ timeout: 10_000 });
  }

  public async openBoard(name: string): Promise<void> {
    await this.boardTile(name).click();
    await expect(this.page).toHaveURL(/\/boards\/[^/]+$/);
  }

  public async createList(name: string): Promise<void> {
    await this.page.locator("button[title='Add List']").first().click();

    const form = this.page.locator('form').filter({ has: this.page.locator("textarea[name='name']") }).last();
    await form.locator("textarea[name='name']").fill(name);
    await form.locator("button[title='Add list']").click();

    await expect(this.listHeader(name)).toBeVisible({ timeout: 10_000 });
    await this.page.keyboard.press('Escape');
  }

  public async createCard(name: string): Promise<void> {
    await this.page.locator("button[title='Add Card']").first().click();

    const form = this.page.locator('form').filter({ has: this.page.locator("textarea[name='name']") }).last();
    await form.locator("textarea[name='name']").fill(name);
    await form.locator("button[title='Add card']").click();

    await expect(this.card(name)).toBeVisible({ timeout: 10_000 });
    await this.page.keyboard.press('Escape');
  }

  public async openCard(name: string): Promise<void> {
    await this.card(name).click();

    await expect(this.page).toHaveURL(/\/cards\/[^/]+$/);
    await expect(this.cardModalTitle(name)).toBeVisible({ timeout: 10_000 });
  }

  public async closeCard(): Promise<void> {
    await this.page.locator("button[title='Close Card']").click();
    await expect(this.page).toHaveURL(/\/boards\/[^/]+$/);
  }
}
