# E2E Findings And Fixes

## Summary

This document captures what was found while reviewing the project and Playwright framework, plus the fixes made while adding E2E coverage.

The application was verified as a Docker-served 4ga Boards instance on `http://localhost:3000`. The Playwright runner lives in `tests/`, with specs in `tests/e2e/specs` and page objects in `tests/e2e/pageObjects`.

## Findings

| Area | Finding | Impact |
| --- | --- | --- |
| Test framework | Playwright was already configured under `tests/playwright.config.ts`. | No bootstrap was needed; new tests should follow the existing page-object style. |
| Existing E2E scope | Existing tests covered valid admin login and admin user creation. | Coverage missed negative auth behavior and the main project/board/list/card workflow. |
| Runtime | Docker app was healthy on port `3000`; local host had Node `22.22.0`, while the repo asks for Node `24.11+`. | Tests can run against Docker, but local package commands show an engine warning. |
| Browser runtime | Playwright Chromium was not installed locally. | Browser install was required before running specs. |
| Browser sandbox | Chromium launch failed inside the command sandbox on macOS with a Mach port permission error. | Playwright tests needed to run outside the command sandbox. |
| Test data | The user-creation test used fixed `test_user` data. | Repeated runs could collide with prior state. |
| Suite isolation | Full suite initially ran multiple workers locally against the same Docker app and demo account. | Stateful tests interfered with one another. |
| Cleanup | User cleanup used UI delete steps and consumed the test timeout. | Cleanup was slower and more brittle than the behavior under test. |
| Card locator | The new board workflow initially clicked the card title, which opens inline editing rather than the card modal in some views. | The test verified card creation but failed when opening the card. |

## Fixes Made

| Fix | Files |
| --- | --- |
| Added `E2E_BASE_URL` support so tests can target Docker or another app URL without editing page objects. | `tests/playwright.config.ts`, `tests/e2e/support/urls.ts`, `tests/e2e/pageObjects/LoginPage.ts`, `tests/e2e/pageObjects/UserSettingPage.ts` |
| Forced Playwright to one worker and increased timeout to match a shared Docker-backed E2E environment. | `tests/playwright.config.ts` |
| Added API cleanup helpers for project and user records created by E2E tests. | `tests/e2e/support/api.ts` |
| Made admin user creation test data unique per run and moved cleanup to authenticated API cleanup. | `tests/e2e/specs/addUser.spec.ts` |
| Added invalid-login coverage with user-visible error and focus assertions. | `tests/e2e/specs/login.spec.ts` |
| Added a board workflow page object for project, board, list, card creation, card modal opening, and reload persistence checks. | `tests/e2e/pageObjects/BoardPage.ts` |
| Added an E2E spec for creating a project, board, list, and card through the UI, then verifying the card opens and persists after reload. | `tests/e2e/specs/boardWorkflow.spec.ts` |
| Corrected the card-opening locator to target the card's button-like container instead of the editable title text. | `tests/e2e/pageObjects/BoardPage.ts` |
| Added documentation for the test plan and AI-agent workflow. | `docs/testing/e2e-test-plan.md`, `docs/testing/ai-agent-playwright-workflow.md` |

## Verification

### Engineering Review

The E2E test plan now includes the engineering-review output required for this pass:

- Scope challenge for the eight-file-plus change set.
- Existing assets reused instead of rebuilding the framework.
- Explicit NOT-in-scope items.
- ASCII runtime-flow and coverage diagrams.
- Failure-mode review for the selected E2E paths.
- Performance notes for Docker-backed Playwright runs.
- Implementation task checklist.

### QA Verification

QA health score for the covered E2E scope: `10/10`.

Issues found in the final verification run: `0`.

The full Playwright suite passed against the Docker app:

```bash
corepack pnpm -C tests test
```

Result:

```text
4 passed (11.7s)
```

The suite inventory is:

```text
addUser.spec.ts:6:5       admin user can create a new user
boardWorkflow.spec.ts:6:5 admin can create a project board list and card
login.spec.ts:4:5         admin user logs in with valid credentials
login.spec.ts:22:5        user remains on login page with invalid credentials
```

Focused runs also passed:

```bash
corepack pnpm -C tests test e2e/specs/login.spec.ts
corepack pnpm -C tests test e2e/specs/boardWorkflow.spec.ts
```

## Remaining Notes

- Host Node should be upgraded to the repo-required `24.11+` for clean local execution.
- Docker is the right app runtime for this repo's current E2E workflow.
- Future high-value E2E coverage should add drag-and-drop, card details, import/export, and permissions in small independent specs.
