import { APIRequestContext, expect, Page } from '@playwright/test';

type ProjectSummary = {
  id: string;
  name: string;
};

type ProjectsResponse = {
  items?: ProjectSummary[];
};

type UserSummary = {
  id: string;
  email: string;
};

type UsersResponse = {
  items?: UserSummary[];
};

const authorizationHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
});

export const getAccessTokenFromPage = async (page: Page): Promise<string> => {
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((cookie) => cookie.name === 'accessToken')?.value;

  expect(accessToken, 'Expected authenticated browser context to contain an access token cookie').toBeTruthy();

  return accessToken as string;
};

export const deleteProjectsByName = async (page: Page, request: APIRequestContext, projectNames: string[]): Promise<void> => {
  if (projectNames.length === 0) {
    return;
  }

  const accessToken = await getAccessTokenFromPage(page);
  const headers = authorizationHeaders(accessToken);
  const projectsResponse = await request.get('/api/projects', { headers });

  expect(projectsResponse.ok(), `Expected projects lookup to succeed during cleanup, got ${projectsResponse.status()}`).toBeTruthy();

  const body = (await projectsResponse.json()) as ProjectsResponse;
  const targetNames = new Set(projectNames);
  const projects = body.items?.filter((project) => targetNames.has(project.name)) ?? [];

  for (const project of projects) {
    const deleteResponse = await request.delete(`/api/projects/${project.id}`, { headers });

    expect(deleteResponse.ok(), `Expected cleanup delete for project "${project.name}" to succeed, got ${deleteResponse.status()}`).toBeTruthy();
  }
};

export const deleteUsersByEmail = async (page: Page, request: APIRequestContext, emails: string[]): Promise<void> => {
  if (emails.length === 0) {
    return;
  }

  const accessToken = await getAccessTokenFromPage(page);
  const headers = authorizationHeaders(accessToken);
  const usersResponse = await request.get('/api/users', { headers });

  expect(usersResponse.ok(), `Expected users lookup to succeed during cleanup, got ${usersResponse.status()}`).toBeTruthy();

  const body = (await usersResponse.json()) as UsersResponse;
  const targetEmails = new Set(emails.map((email) => email.toLowerCase()));
  const users = body.items?.filter((user) => targetEmails.has(user.email.toLowerCase())) ?? [];

  for (const user of users) {
    const deleteResponse = await request.delete(`/api/users/${user.id}`, { headers });

    expect(deleteResponse.ok(), `Expected cleanup delete for user "${user.email}" to succeed, got ${deleteResponse.status()}`).toBeTruthy();
  }
};
