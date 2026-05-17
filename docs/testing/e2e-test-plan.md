# 4ga Boards E2E Test Plan

## Purpose

This plan defines the first production-grade Playwright E2E coverage for 4ga Boards. It explains what is covered, why it is covered at the browser layer, how tests should be run, what data they create, and how future contributors should extend the suite without creating brittle or slow tests.

The plan follows Martin Fowler's test-pyramid guidance: keep the UI layer small, focused, and valuable. E2E tests should prove that critical user journeys work across the browser, React client, Sails API, auth, sockets, and PostgreSQL. They should not duplicate every business-rule permutation that belongs in unit or integration tests.

## Product Context

4ga Boards is a realtime project-management application with the hierarchy:

```text
Project -> Board -> List -> Card -> Task / Comment / Attachment
```

The stack under test is:

| Layer | Technology | E2E relevance |
| --- | --- | --- |
| Browser UI | React, Redux, Redux-Saga, Redux-ORM | User interactions, routing, visible state |
| Realtime/API | Sails.js, Socket.IO-style request wrapper, REST endpoints | Authenticated creates, reads, deletes, persistence |
| Data | PostgreSQL | Durable user, project, board, list, card records |
| Runtime | Docker app on `http://localhost:3000` | Test target used locally and in CI-like runs |
| Test runner | Playwright in `tests/` | Browser automation and cross-layer assertions |

## Quality Goals

1. Prove that a seeded admin can authenticate and reach the dashboard.
2. Prove that invalid credentials are rejected with user-visible feedback.
3. Prove that an admin can create a local user from the settings UI.
4. Prove that the core product workflow works end to end: create project, board, list, and card.
5. Prove created board data persists across browser reload.
6. Keep the suite deterministic against a shared Docker-backed app.
7. Leave the environment clean after each test.

## Test Strategy

### Test Pyramid Placement

The E2E suite intentionally covers a small number of high-value flows. It does not attempt broad field-level validation or every role/permission branch.

| Test layer | What belongs there | What this plan does |
| --- | --- | --- |
| Unit | Pure functions, reducers, helpers, component logic | Not expanded here |
| Integration/API | Endpoint authorization, model helpers, DB behavior | Existing server tests own much of this |
| Component | Local UI states, forms, conditional rendering | Not expanded here |
| E2E | Critical browser journeys across UI, auth, API, and DB | Covered by this plan |

### E2E Design Rules

- Test user-visible behavior, not implementation details.
- Use real UI interactions for the behavior being validated.
- Use API calls only for cleanup or setup that is not the purpose of the test.
- Generate unique test data per run.
- Run specs serially against the shared Docker app to avoid demo-account collisions.
- Prefer stable accessible names and title-backed locators already exposed by the UI.
- Avoid long "tour" tests. One test should prove one business workflow.
- Keep each assertion tied to a user-observable result.

## Test Environment

### Required Services

The application should be running through Docker:

```bash
docker compose up -d
```

Expected app URL:

```text
http://localhost:3000
```

Expected seeded admin:

```text
username: demo
password: demo
```

### Test Runner

The Playwright project is under `tests/`.

```bash
corepack pnpm -C tests test
```

The base URL defaults to `http://localhost:3000` and can be overridden:

```bash
E2E_BASE_URL=http://localhost:3000 corepack pnpm -C tests test
```

### Playwright Configuration

File: `tests/playwright.config.ts`

| Setting | Value | Reason |
| --- | --- | --- |
| `testDir` | `./e2e/specs` | Keeps specs grouped under one E2E directory |
| `workers` | `1` | Prevents shared demo-account and Docker-state collisions |
| `timeout` | `60_000` | Allows Docker-backed flows and cleanup to complete reliably |
| `retries` | `1` in CI, `0` locally | Retries only where infrastructure noise is more likely |
| `trace` | `on-first-retry` | Captures debugging evidence without bloating happy-path runs |
| `screenshot` | `only-on-failure` | Useful failure evidence, low normal-run overhead |
| `video` | `retain-on-failure` | Helps diagnose UI timing and selector mistakes |

## Feature Selection

### Selected Feature 1: Authentication And Admin Access

Authentication is a gateway workflow. If it fails, all authenticated product behavior is blocked. It also crosses browser forms, API token creation, cookie storage, route redirects, and dashboard rendering.

Covered:

- Valid seeded admin login.
- Invalid password rejection.
- Error message visibility.
- Login page remains active after failed login.
- Password field focus after failed login.

### Selected Feature 2: Admin User Management

User management is a high-value admin workflow. It verifies authenticated navigation, settings access, form submission, server persistence, and data display in an admin table.

Covered:

- Admin opens Settings > Users.
- Admin creates a unique local user.
- Created user appears in the users list.
- Created user is cleaned up by API.

### Selected Feature 3: Core Board Workflow

The project/board/list/card path is the core product value. It proves that a user can create the main hierarchy and that created work survives a reload.

Covered:

- Admin creates a project.
- Admin opens the project.
- Admin creates a board.
- Admin opens the board.
- Admin creates a list.
- Admin creates a card.
- Admin opens the card modal.
- Card remains visible after closing the modal and reloading the board.
- Created project is cleaned up by API.

## Coverage Matrix

| Requirement | Test ID | Spec file | Status |
| --- | --- | --- | --- |
| Seeded admin can log in | AUTH-001 | `tests/e2e/specs/login.spec.ts` | Automated |
| Invalid credentials are rejected | AUTH-002 | `tests/e2e/specs/login.spec.ts` | Automated |
| Admin can create a local user | USER-001 | `tests/e2e/specs/addUser.spec.ts` | Automated |
| Admin can create a project | BOARD-001 | `tests/e2e/specs/boardWorkflow.spec.ts` | Automated |
| Admin can create a board | BOARD-002 | `tests/e2e/specs/boardWorkflow.spec.ts` | Automated |
| Admin can create a list | BOARD-003 | `tests/e2e/specs/boardWorkflow.spec.ts` | Automated |
| Admin can create and open a card | BOARD-004 | `tests/e2e/specs/boardWorkflow.spec.ts` | Automated |
| Created card persists after reload | BOARD-005 | `tests/e2e/specs/boardWorkflow.spec.ts` | Automated |

## Detailed Test Cases

### AUTH-001: Admin User Logs In With Valid Credentials

File: `tests/e2e/specs/login.spec.ts`

Objective: prove that the seeded admin can authenticate and reach the dashboard.

Preconditions:

- Docker app is running.
- Seeded `demo` user exists.
- Browser context is clean.

Steps:

1. Navigate to `/login`.
2. Fill `emailOrUsername` with `demo`.
3. Fill `password` with `demo`.
4. Click `Log in`.

Expected results:

- URL becomes `/`.
- Dashboard title is visible.
- No login error message is displayed.

Primary risks covered:

- Login route broken.
- Token creation broken.
- Access-token cookie not set.
- Post-login route redirect broken.
- Dashboard shell fails to render after auth.

### AUTH-002: Invalid Credentials Are Rejected

File: `tests/e2e/specs/login.spec.ts`

Objective: prove that invalid credentials do not authenticate the user and produce useful feedback.

Preconditions:

- Docker app is running.
- Seeded `demo` user exists.
- Browser context is clean.

Steps:

1. Navigate to `/login`.
2. Fill `emailOrUsername` with `demo`.
3. Fill `password` with `not-the-demo-password`.
4. Click `Log in`.

Expected results:

- URL remains `/login`.
- Error text `Invalid username or password` is visible.
- Password field receives focus.

Primary risks covered:

- Invalid users accidentally receive access.
- Failed login does not show feedback.
- Failed login redirects to the wrong route.
- Form recovery is poor after failure.

### USER-001: Admin Creates A Local User

File: `tests/e2e/specs/addUser.spec.ts`

Objective: prove that an authenticated admin can create a user from the settings UI.

Preconditions:

- Docker app is running.
- Seeded `demo` admin exists.
- Test-generated user email and username do not already exist.

Data:

```text
email: e2e-user-{uniqueId}@example.com
password: Abcde@123
name: E2E User {uniqueId}
username: e2e_{uniqueId}
```

Steps:

1. Log in as `demo`.
2. Open profile/settings menu.
3. Navigate to Users settings.
4. Click `Add User`.
5. Fill email, password, name, and username.
6. Submit the form.
7. Verify the new email appears in the users table.

Expected results:

- Settings Users page is reachable.
- Add User form accepts valid unique data.
- Created user appears in the list.
- API cleanup deletes the created user after test completion.

Primary risks covered:

- Admin settings navigation broken.
- User create form broken.
- Valid password or username rules regress.
- Created users do not appear in admin list.
- Repeated test runs collide with stale data.

### BOARD-001 Through BOARD-005: Admin Creates Project, Board, List, And Card

File: `tests/e2e/specs/boardWorkflow.spec.ts`

Objective: prove that the central product hierarchy can be created through the browser and persists after reload.

Preconditions:

- Docker app is running.
- Seeded `demo` admin exists.
- Project creation is enabled for the admin.
- Browser context is clean.

Data:

```text
project: E2E Project {uniqueId}
board: E2E Board {uniqueId}
list: Ready {uniqueId}
card: Validate E2E workflow {uniqueId}
```

Steps:

1. Log in as `demo`.
2. Create a project from the dashboard.
3. Verify the project tile is visible.
4. Open the project.
5. Create a board inside the project.
6. Verify the board tile is visible.
7. Open the board.
8. Create a list.
9. Verify the list header is visible.
10. Create a card in the list.
11. Verify the card is visible.
12. Open the card.
13. Verify the card modal title is visible.
14. Verify the card is associated with the created list.
15. Close the card modal.
16. Reload the board.
17. Verify the card remains visible.

Expected results:

- Every hierarchy item is created and visible at the correct step.
- Project route changes to `/projects/{id}`.
- Board route changes to `/boards/{id}`.
- Card route changes to `/cards/{id}` while modal is open.
- Closing the modal returns to the board route.
- Reloading the board does not lose the created card.
- API cleanup deletes the created project and its nested records.

Primary risks covered:

- Project create API or UI workflow broken.
- Board create API or UI workflow broken.
- List create API or UI workflow broken.
- Card create API or UI workflow broken.
- Card modal route handling broken.
- Created records do not persist to the backend.
- UI displays stale state that disappears on reload.

## Test Data Strategy

All create tests use generated names based on the current timestamp. This prevents collisions with earlier runs and allows tests to run repeatedly against the same Docker database.

Created records:

| Entity | Naming pattern | Cleanup |
| --- | --- | --- |
| User | `e2e-user-{uniqueId}@example.com` | `DELETE /api/users/{id}` |
| Project | `E2E Project {uniqueId}` | `DELETE /api/projects/{id}` |
| Board | `E2E Board {uniqueId}` | Deleted with parent project |
| List | `Ready {uniqueId}` | Deleted with parent project |
| Card | `Validate E2E workflow {uniqueId}` | Deleted with parent project |

Cleanup uses authenticated API helpers in `tests/e2e/support/api.ts`. This keeps cleanup fast and avoids making destructive UI flows part of unrelated tests.

## Locator Strategy

Current tests prefer these locator sources:

| Locator source | Use case | Reason |
| --- | --- | --- |
| Role and accessible name | Buttons and card containers | Closest to how users interact |
| `title` attributes | Project, board, list, modal titles | Existing app exposes stable titles |
| Form field `name` | Inputs and textareas | Stable for app forms |
| Visible text | Error messages | Tests user-facing copy |

Avoid:

- CSS-module class names.
- Deep DOM structure.
- `nth()` unless the UI has duplicate controls and there is no better public signal.
- Waiting on implementation-specific network requests unless debugging a failure.

## Execution Plan

### Smoke Run

Use this for quick validation of the most recent E2E changes:

```bash
corepack pnpm -C tests test e2e/specs/login.spec.ts
corepack pnpm -C tests test e2e/specs/boardWorkflow.spec.ts
```

### Full E2E Run

Use this before merging E2E changes:

```bash
corepack pnpm -C tests test
```

Expected current result:

```text
4 passed
```

### CI Command

The root package exposes:

```bash
pnpm ci:test:e2e
```

That command starts the app and runs the E2E package.

## Entry Criteria

Run the suite only when:

- Docker database and app services are healthy.
- The app is reachable at `E2E_BASE_URL` or `http://localhost:3000`.
- Playwright browsers are installed.
- Seeded `demo` credentials are available.
- No developer is manually using the same Docker instance for conflicting test data.

## Exit Criteria

The E2E suite is considered passing when:

- All Playwright tests pass with one worker.
- No test leaves `E2E Project *` or `e2e-user-*` records behind.
- Failure artifacts are either ignored or removed before commit.
- No test relies on execution order beyond the configured single-worker isolation.
- New E2E coverage maps to a high-value user journey in this plan.

## Risks And Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Shared demo account state leaks across tests | Medium | High | Force one worker and generate unique data |
| Test data collides with earlier runs | Low | Medium | Timestamp-based names and API cleanup |
| Docker app is slower than local dev server | Medium | Medium | 60-second test timeout and visible-state waits |
| UI copy changes break text assertions | Medium | Low | Keep copy assertions limited to user-critical messages |
| Title attributes change | Medium | Medium | Prefer role locators where possible |
| Card/list drag-and-drop is flaky | Medium | High | Keep drag-and-drop out of this first suite; add separately with focused helpers |
| Browser launch blocked by host sandbox | Medium | High | Run Playwright outside the command sandbox when needed |
| Host Node version differs from repo engine | Medium | Medium | Prefer Docker for app runtime; upgrade host Node for clean local tooling |

## Defect Triage Rules

When an E2E test fails:

1. Reproduce with the focused spec.
2. Inspect Playwright screenshot, video, and trace if available.
3. Determine whether the failure is product, data, locator, or environment.
4. Fix product defects in app code.
5. Fix locator defects in page objects.
6. Fix data collisions in setup/cleanup helpers.
7. Do not hide real product failures with longer timeouts.

## Maintenance Rules

- Add one page-object method only when at least one spec needs it.
- Keep cleanup helpers narrow and explicit.
- Do not add broad `beforeEach` setup that makes tests hard to read.
- Keep spec names user-oriented.
- Keep assertions close to the action that should make them true.
- Prefer a new small spec over expanding one large scenario.
- Update this plan when adding a new feature area.

## Future Test Plan

| Priority | Feature | Candidate scenarios | Notes |
| --- | --- | --- | --- |
| P1 | Card details | Add description, add task, complete task, add comment | High product value, good next E2E target |
| P1 | Permissions | Non-admin cannot access Users settings; board member permissions | Requires stable fixture user setup |
| P2 | Drag-and-drop | Move card between lists; reorder lists | Needs dedicated drag helper and flake monitoring |
| P2 | Import/export | Export board, import board file | Needs file download/upload handling |
| P2 | Attachments | Upload file, verify attachment, delete attachment | Needs small fixture file and storage cleanup |
| P3 | Preferences | Switch default board/list view and verify behavior | Useful but lower risk than core creation |
| P3 | Notifications | Comment or assignment notification appears | May require multi-user setup |

## Current Automated Tests

| File | Test | Purpose |
| --- | --- | --- |
| `tests/e2e/specs/login.spec.ts` | `admin user logs in with valid credentials` | Auth smoke |
| `tests/e2e/specs/login.spec.ts` | `user remains on login page with invalid credentials` | Negative auth behavior |
| `tests/e2e/specs/addUser.spec.ts` | `admin user can create a new user` | Admin user management |
| `tests/e2e/specs/boardWorkflow.spec.ts` | `admin can create a project board list and card` | Core board workflow |

## Open Questions

- Should CI reset the Docker database before each E2E run, or rely on unique data plus cleanup?
- Should future tests create fixture data through API setup to shorten long UI flows?
- Should the app expose test-friendly `data-testid` attributes for high-risk controls like cards and drag handles?
- Should E2E run against the production Docker image only, or also against a dev-server build?

## Engineering Review Report

Generated for the current Playwright E2E implementation.

### Scope Challenge

The change touches more than eight files, which normally triggers a scope challenge. The scope is still acceptable because the touched files are concentrated in three low-risk buckets: documentation, Playwright configuration, and E2E test code. No product source code, database schema, API contract, or runtime behavior is modified.

The smaller version would only add the board workflow spec and leave existing login/user tests unchanged. That would save a few files, but it would keep duplicated URL handling, leave cleanup brittle, and make the suite harder to run against Docker. The complete version is the better tradeoff because it adds shared helpers once and keeps test data deterministic.

### What Already Exists

| Existing asset | Reused? | Notes |
| --- | --- | --- |
| `tests/playwright.config.ts` | Yes | Extended instead of replacing the test framework |
| `tests/e2e/pageObjects/LoginPage.ts` | Yes | Kept the existing login page-object pattern |
| `tests/e2e/pageObjects/UserSettingPage.ts` | Yes | Kept existing settings workflow and made it Docker/base-URL aware |
| Seeded `demo` admin | Yes | Used as the stable authenticated actor |
| Docker app on port `3000` | Yes | Treated as the authoritative local E2E target |
| Sails REST endpoints | Yes | Used only for cleanup, not for bypassing behavior under test |

### NOT In Scope

| Deferred work | Rationale |
| --- | --- |
| App source-code fixes | This pass is focused on E2E coverage and test framework reliability |
| Full permission matrix | Requires stable multi-user fixtures and belongs in a separate suite expansion |
| Drag-and-drop automation | High flake risk; needs a focused helper and separate stabilization |
| Attachment upload/download | Requires file fixture and storage cleanup decisions |
| CI database reset strategy | Needs team decision on isolation versus speed |
| Cross-browser coverage | Chromium is enough for the first deterministic Docker-backed suite |

### Architecture Review

The E2E architecture is intentionally thin. Browser tests drive the UI for the behavior being validated, then use authenticated API cleanup to remove records the test created.

```text
Playwright spec
  |
  v
Page object method
  |
  v
Browser UI at http://localhost:3000
  |
  v
React / Redux / Redux-Saga
  |
  v
Sails API and socket request wrapper
  |
  v
PostgreSQL
  |
  v
Visible browser state assertion
  |
  v
API cleanup helper removes generated records
```

Architecture finding: no new product architecture is introduced. The main test-design decision is to run with one worker because all tests share the seeded Docker database and the seeded `demo` admin account.

### Code Quality Review

The test code follows the existing page-object style instead of introducing a second abstraction. Shared helpers are narrow:

- `tests/e2e/support/urls.ts` centralizes base URL handling.
- `tests/e2e/support/api.ts` centralizes authenticated cleanup.
- `tests/e2e/pageObjects/BoardPage.ts` models the board hierarchy at user-action level.

The suite avoids brittle CSS selectors where possible. The highest-risk locator area is still card/list controls because the app exposes repeated buttons with similar labels. That risk is contained in `BoardPage`, not spread across specs.

### Test Coverage Diagram

```text
USER FLOWS                                           CURRENT COVERAGE
[+] Authentication                                  tests/e2e/specs/login.spec.ts
  |-- [*** TESTED] valid demo login                 AUTH-001
  |-- [*** TESTED] invalid password feedback        AUTH-002
  `-- [GAP] expired session recovery                Future auth expansion

[+] Admin user management                           tests/e2e/specs/addUser.spec.ts
  |-- [**  TESTED] create unique local user         USER-001
  |-- [**  TESTED] user appears in settings table   USER-001
  `-- [GAP] duplicate email validation              Better as form/API coverage first

[+] Core board workflow                             tests/e2e/specs/boardWorkflow.spec.ts
  |-- [*** TESTED] create project                   BOARD-001
  |-- [*** TESTED] create board                     BOARD-002
  |-- [*** TESTED] create list                      BOARD-003
  |-- [*** TESTED] create card and open modal       BOARD-004
  |-- [*** TESTED] reload persistence               BOARD-005
  `-- [GAP] move/reorder card                       Future drag-and-drop suite

Legend:
*** = behavior plus persistence or negative path
**  = happy path with cleanup
GAP = intentionally deferred and listed in Future Test Plan
```

### Failure Modes

| Codepath or flow | Realistic failure | Covered now? | User-visible? | Notes |
| --- | --- | --- | --- | --- |
| Valid login | Token cookie is not set | Yes | Yes | Dashboard assertion catches failed redirect |
| Invalid login | Error message is missing | Yes | Yes | Negative auth test checks copy and focus |
| User creation | Created user does not appear | Yes | Yes | Settings table assertion catches it |
| User cleanup | Cleanup API token missing | Partly | No | Helper fails the test instead of leaving silent state |
| Project creation | Project tile never renders | Yes | Yes | Board workflow asserts each hierarchy step |
| Card creation | UI shows card but backend does not persist | Yes | Yes | Reload assertion catches stale client-only state |
| Card modal route | Card opens wrong route or modal title absent | Yes | Yes | Modal title and URL assertions catch it |
| Parallel execution | Shared Docker state collides | Yes | No | Mitigated by `workers: 1` and unique names |

No critical gap was found where a failure would be silent, unhandled, and untested for the selected E2E scope.

### Performance Review

The E2E suite does not introduce product runtime work. The relevant performance concern is test-suite runtime against Docker. The suite mitigates this by:

- Keeping E2E scope to four high-value tests.
- Using UI waits tied to visible state instead of arbitrary sleeps.
- Using API cleanup instead of slow destructive UI flows.
- Running one worker for determinism, accepting slower runtime to avoid data races.

### Worktree Parallelization Strategy

Sequential implementation is safest for the current patch because the test files share the same Playwright config, page-object conventions, and cleanup helpers.

If this expands later, split by feature lane:

| Lane | Modules touched | Depends on |
| --- | --- | --- |
| Auth/User management | `tests/e2e/specs`, `tests/e2e/pageObjects` | Shared support helpers |
| Board workflows | `tests/e2e/specs`, `tests/e2e/pageObjects` | Shared support helpers |
| Documentation | `docs/testing` | Final test decisions |

Execution order: land shared support helpers first, then feature specs, then documentation updates.

### Implementation Tasks

- [x] Centralize E2E base URL handling for Docker and local runs.
- [x] Add authenticated API cleanup helpers for generated users and projects.
- [x] Add negative login coverage for invalid credentials.
- [x] Stabilize the admin user creation test with unique data and cleanup.
- [x] Add core board workflow coverage for project, board, list, card, modal, and reload persistence.
- [x] Document the E2E test plan, AI-agent workflow, findings, and fixes.
- [ ] Decide whether CI should reset the Docker database before E2E runs.
- [ ] Decide whether high-risk controls should expose stable `data-testid` attributes.
