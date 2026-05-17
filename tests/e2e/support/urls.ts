export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export const appUrl = (path: string): string => new URL(path, BASE_URL).toString();
