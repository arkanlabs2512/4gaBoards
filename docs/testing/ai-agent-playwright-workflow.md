# AI Agent Playwright Workflow

This file records the prompts and constraints used to guide AI agents while designing and implementing the Playwright E2E suite.

## Agent Context Brief

```text
You are acting as an SDET lead for 4ga Boards.
Read the existing Playwright framework before writing tests.
Use Martin Fowler's testing-pyramid principles: keep E2E tests focused, behavior-first, deterministic, and avoid duplicating lower-level tests.
Select one or two product-critical features for E2E coverage.
Produce a test plan, Markdown evidence of AI-agent interaction, and Playwright tests.
```

## Repository Exploration Prompt

```text
Explore the repo structure and testing framework.
Identify:
- application runtime and test commands
- existing Playwright config
- current page object conventions
- seeded credentials and required environment
- one or two high-value user journeys that cross UI, API, and persistence
Return concise findings and recommended E2E targets.
```

## Test Design Prompt

```text
Create a Fowler-style E2E test plan.
Use the existing Playwright framework.
For each test case include:
- feature
- scenario
- user-visible steps
- observable expected result
- setup and cleanup strategy
Avoid implementation-detail assertions and broad app-tour tests.
```

## Implementation Prompt

```text
Implement the selected E2E test cases in Playwright.
Follow existing repo conventions:
- specs in tests/e2e/specs
- page objects in tests/e2e/pageObjects
- no hardcoded test data that collides across runs
- API cleanup is allowed after UI behavior is verified
Update docs with the final test plan and AI workflow notes.
```

## Review Checklist For Future Agents

- Confirm `tests/playwright.config.ts` has the expected `baseURL`.
- Check whether existing specs rely on shared demo state.
- Use unique test data for creates.
- Keep cleanup in `finally` blocks.
- Run a focused spec before running the full E2E suite.
- If dependencies or browsers are missing, report the exact environment blocker.
